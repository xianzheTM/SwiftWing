/**
 * SwiftWing 物理引擎
 * 实现AABB碰撞检测、边界约束和物理模拟
 */

import * as THREE from 'three';
import { Config } from '../core/Config.js';

export class PhysicsEngine {
    constructor() {
        // 碰撞检测缓存
        this.collisionPairs = [];
        this.lastCollisionTime = 0;
        
        // 性能统计
        this.collisionChecks = 0;
        this.collisionHits = 0;
        
        console.log('物理引擎初始化完成');
    }

    /**
     * 更新物理系统
     */
    update(deltaTime, gameObjects) {
        this.collisionChecks = 0;
        this.collisionHits = 0;
        
        // 更新玩家物理
        if (gameObjects.player) {
            this.updatePlayerPhysics(gameObjects.player, deltaTime);
        }
        
        // 检测碰撞
        this.detectCollisions(gameObjects);
        
        // 更新玩家前进位置
        if (gameObjects.player && gameObjects.tunnel) {
            this.updatePlayerForwardMovement(gameObjects.player, gameObjects.tunnel, deltaTime);
        }
    }

    /**
     * 更新玩家物理状态
     */
    updatePlayerPhysics(player, deltaTime) {
        // 隧道边界检查 - 只使用圆形隧道约束
        this.applyTunnelConstraints(player);
    }

    /**
     * 应用移动边界约束
     */
    applyBoundaryConstraints(player) {
        const position = player.getPosition();
        const bounds = Config.PLAYER.BOUNDS;
        
        // X轴约束
        if (position.x < bounds.X_MIN) {
            position.x = bounds.X_MIN;
            player.velocity.x = 0;
        } else if (position.x > bounds.X_MAX) {
            position.x = bounds.X_MAX;
            player.velocity.x = 0;
        }
        
        // Y轴约束
        if (position.y < bounds.Y_MIN) {
            position.y = bounds.Y_MIN;
            player.velocity.y = 0;
        } else if (position.y > bounds.Y_MAX) {
            position.y = bounds.Y_MAX;
            player.velocity.y = 0;
        }
    }

    /**
     * 应用隧道边界约束
     */
    applyTunnelConstraints(player) {
        const position = player.getPosition();
        const distanceFromCenter = Math.sqrt(position.x * position.x + position.y * position.y);
        const maxRadius = Config.TUNNEL.RADIUS - Config.TUNNEL.WALL_THICKNESS - 0.8; // 适度的安全距离，避免看到隧道外部
        
        if (distanceFromCenter > maxRadius) {
            // 将玩家推回隧道内
            const angle = Math.atan2(position.y, position.x);
            position.x = Math.cos(angle) * maxRadius;
            position.y = Math.sin(angle) * maxRadius;
            
            // 停止向外的速度分量
            player.velocity.x = 0;
            player.velocity.y = 0;
            
            // 创建撞墙效果
            this.createWallCollisionEffect(player);
        }
    }

    /**
     * 更新玩家前进移动
     */
    updatePlayerForwardMovement(player, tunnel, deltaTime) {
        const currentSpeed = tunnel.getCurrentSpeed();
        const position = player.getPosition();
        
        // Z轴自动前进
        position.z -= currentSpeed * deltaTime * 60; // 转换为每秒移动距离
    }

    /**
     * 检测所有碰撞
     */
    detectCollisions(gameObjects) {
        if (!gameObjects.player || !gameObjects.obstacleManager) return;
        
        const playerBounds = gameObjects.player.getBoundingBox();
        const obstacles = gameObjects.obstacleManager.getActiveObstacles();
        
        // 检测玩家与障碍物碰撞
        obstacles.forEach(obstacle => {
            this.collisionChecks++;
            
            if (this.checkAABBCollision(playerBounds, obstacle.getBoundingBox())) {
                this.collisionHits++;
                this.handlePlayerObstacleCollision(gameObjects.player, obstacle, gameObjects.obstacleManager);
            }
        });
    }

    /**
     * AABB碰撞检测算法
     */
    checkAABBCollision(box1, box2) {
        const tolerance = Config.PHYSICS.COLLISION_TOLERANCE;
        
        return (
            box1.max.x + tolerance >= box2.min.x &&
            box1.min.x - tolerance <= box2.max.x &&
            box1.max.y + tolerance >= box2.min.y &&
            box1.min.y - tolerance <= box2.max.y &&
            box1.max.z + tolerance >= box2.min.z &&
            box1.min.z - tolerance <= box2.max.z
        );
    }

    /**
     * 处理玩家与障碍物碰撞
     */
    handlePlayerObstacleCollision(player, obstacle, obstacleManager) {
        // 检查玩家是否处理了碰撞（无敌状态等）
        const collisionHandled = player.onCollision(obstacle);
        
        if (collisionHandled) {
            // 创建碰撞特效
            const collisionPoint = this.calculateCollisionPoint(
                player.getBoundingBox(),
                obstacle.getBoundingBox()
            );
            
            // 障碍物爆炸效果
            obstacleManager.createExplosionEffect(obstacle.getPosition());
            
            // 移除障碍物
            obstacleManager.removeObstacle(obstacle);
            
            // 相机震动
            if (Config.DEBUG.COLLISION_VISUALIZATION) {
                console.log('碰撞发生:', {
                    playerPos: player.getPosition(),
                    obstaclePos: obstacle.getPosition(),
                    collisionPoint: collisionPoint
                });
            }
        }
    }

    /**
     * 计算碰撞点
     */
    calculateCollisionPoint(box1, box2) {
        return new THREE.Vector3(
            (Math.max(box1.min.x, box2.min.x) + Math.min(box1.max.x, box2.max.x)) / 2,
            (Math.max(box1.min.y, box2.min.y) + Math.min(box1.max.y, box2.max.y)) / 2,
            (Math.max(box1.min.z, box2.min.z) + Math.min(box1.max.z, box2.max.z)) / 2
        );
    }

    /**
     * 创建撞墙效果
     */
    createWallCollisionEffect(player) {
        // 这里可以添加撞墙的粒子效果、声音等
        console.log('玩家撞到隧道壁');
    }

    /**
     * 射线检测（未来可能用到）
     */
    raycast(origin, direction, maxDistance, objects) {
        const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
        const intersections = raycaster.intersectObjects(objects, true);
        
        return intersections.length > 0 ? intersections[0] : null;
    }

    /**
     * 球体碰撞检测
     */
    checkSphereCollision(center1, radius1, center2, radius2) {
        const distance = center1.distanceTo(center2);
        return distance <= (radius1 + radius2);
    }

    /**
     * 点与AABB碰撞检测
     */
    checkPointAABBCollision(point, box) {
        return (
            point.x >= box.min.x && point.x <= box.max.x &&
            point.y >= box.min.y && point.y <= box.max.y &&
            point.z >= box.min.z && point.z <= box.max.z
        );
    }

    /**
     * 获取两个AABB的重叠体积
     */
    getAABBOverlapVolume(box1, box2) {
        const overlapX = Math.max(0, Math.min(box1.max.x, box2.max.x) - Math.max(box1.min.x, box2.min.x));
        const overlapY = Math.max(0, Math.min(box1.max.y, box2.max.y) - Math.max(box1.min.y, box2.min.y));
        const overlapZ = Math.max(0, Math.min(box1.max.z, box2.max.z) - Math.max(box1.min.z, box2.min.z));
        
        return overlapX * overlapY * overlapZ;
    }

    /**
     * 预测碰撞（用于提前警告）
     */
    predictCollision(player, obstacle, deltaTime) {
        const playerPos = player.getPosition().clone();
        const playerVel = player.velocity.clone();
        const obstaclePos = obstacle.getPosition().clone();
        
        // 预测下一帧位置
        playerPos.add(playerVel.clone().multiplyScalar(deltaTime));
        
        // 创建预测边界框
        const predictedPlayerBounds = player.getBoundingBox().clone();
        const offset = playerPos.clone().sub(player.getPosition());
        predictedPlayerBounds.translate(offset);
        
        return this.checkAABBCollision(predictedPlayerBounds, obstacle.getBoundingBox());
    }

    /**
     * 获取性能统计
     */
    getStats() {
        return {
            collisionChecks: this.collisionChecks,
            collisionHits: this.collisionHits,
            hitRate: this.collisionChecks > 0 ? (this.collisionHits / this.collisionChecks * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * 设置物理参数
     */
    setPhysicsParams(params) {
        if (params.gravity !== undefined) {
            Config.PHYSICS.GRAVITY = params.gravity;
        }
        if (params.collisionTolerance !== undefined) {
            Config.PHYSICS.COLLISION_TOLERANCE = params.collisionTolerance;
        }
        
        console.log('物理参数已更新:', params);
    }

    /**
     * 启用/禁用碰撞可视化
     */
    setCollisionVisualization(enabled) {
        Config.DEBUG.COLLISION_VISUALIZATION = enabled;
        console.log(`碰撞可视化已${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 重置物理引擎
     */
    reset() {
        this.collisionPairs = [];
        this.lastCollisionTime = 0;
        this.collisionChecks = 0;
        this.collisionHits = 0;
        
        console.log('物理引擎已重置');
    }

    /**
     * 销毁物理引擎
     */
    dispose() {
        this.reset();
        console.log('物理引擎已销毁');
    }
} 