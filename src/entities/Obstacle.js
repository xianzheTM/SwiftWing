/**
 * SwiftWing 障碍物系统
 * 实现多种类型障碍物的生成、管理和碰撞检测
 */

import * as THREE from 'three';
import { Config } from '../core/Config.js';

/**
 * 单个障碍物类
 */
export class Obstacle {
    constructor(type, position) {
        this.type = type;
        this.mesh = null;
        this.boundingBox = new THREE.Box3();
        this.isActive = true;
        this.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        };
        
        this.createMesh(position);
    }

    /**
     * 创建障碍物网格
     */
    createMesh(position) {
        const obstacleConfig = Config.OBSTACLES.TYPES[this.type];
        let geometry, material;

        // 根据类型创建几何体
        switch (this.type) {
            case 'CUBE':
                geometry = new THREE.BoxGeometry(
                    obstacleConfig.SIZE.width,
                    obstacleConfig.SIZE.height,
                    obstacleConfig.SIZE.depth
                );
                break;
            
            case 'SPHERE':
                geometry = new THREE.SphereGeometry(obstacleConfig.RADIUS, 16, 12);
                break;
            
            case 'PYRAMID':
                geometry = new THREE.ConeGeometry(obstacleConfig.BASE, obstacleConfig.HEIGHT, 6);
                break;
            
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        // 创建材质
        material = new THREE.MeshLambertMaterial({
            color: obstacleConfig.COLOR,
            emissive: new THREE.Color(obstacleConfig.COLOR).multiplyScalar(0.2),
            transparent: true,
            opacity: 0.9
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;

        // 添加发光边框效果
        this.addGlowEffect();

        this.updateBoundingBox();
    }

    /**
     * 添加发光边框效果
     */
    addGlowEffect() {
        // 创建稍大的线框版本
        const wireframeGeometry = this.mesh.geometry.clone();
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: Config.OBSTACLES.TYPES[this.type].COLOR,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });

        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        wireframe.scale.setScalar(1.05);
        this.mesh.add(wireframe);
    }

    /**
     * 更新障碍物
     */
    update(deltaTime) {
        if (!this.mesh || !this.isActive) return;

        // 自转动画
        this.mesh.rotation.x += this.rotationSpeed.x;
        this.mesh.rotation.y += this.rotationSpeed.y;
        this.mesh.rotation.z += this.rotationSpeed.z;

        // 更新边界框
        this.updateBoundingBox();

        // 材质动画
        this.updateMaterial(deltaTime);
    }

    /**
     * 更新材质动画
     */
    updateMaterial(deltaTime) {
        const time = Date.now() * 0.001;
        
        // 发光强度变化
        const glowIntensity = 0.2 + Math.sin(time * 3 + this.mesh.position.x) * 0.1;
        this.mesh.material.emissive.copy(
            new THREE.Color(Config.OBSTACLES.TYPES[this.type].COLOR).multiplyScalar(glowIntensity)
        );
    }

    /**
     * 更新碰撞边界框
     */
    updateBoundingBox() {
        if (this.mesh) {
            this.boundingBox.setFromObject(this.mesh);
        }
    }

    /**
     * 获取碰撞边界框
     */
    getBoundingBox() {
        return this.boundingBox;
    }

    /**
     * 获取位置
     */
    getPosition() {
        return this.mesh ? this.mesh.position : new THREE.Vector3();
    }

    /**
     * 设置位置
     */
    setPosition(position) {
        if (this.mesh) {
            this.mesh.position.copy(position);
            this.updateBoundingBox();
        }
    }

    /**
     * 激活/停用障碍物
     */
    setActive(active) {
        this.isActive = active;
        if (this.mesh) {
            this.mesh.visible = active;
        }
    }

    /**
     * 重置障碍物
     */
    reset(type, position) {
        this.type = type;
        this.isActive = true;
        
        if (this.mesh) {
            this.mesh.position.copy(position);
            
            // 更新材质颜色
            const obstacleConfig = Config.OBSTACLES.TYPES[type];
            this.mesh.material.color.setHex(obstacleConfig.COLOR);
            this.mesh.material.emissive.copy(
                new THREE.Color(obstacleConfig.COLOR).multiplyScalar(0.2)
            );
            
            this.updateBoundingBox();
        }
    }

    /**
     * 销毁障碍物
     */
    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}

/**
 * 障碍物管理器
 */
export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.obstaclePool = [];
        this.lastSpawnZ = 0;
        
        // 生成参数
        this.spawnDistance = Config.OBSTACLES.MIN_DISTANCE;
        this.maxObstacles = Config.PERFORMANCE.MAX_OBSTACLES;
        
        console.log('障碍物管理器初始化完成');
    }

    /**
     * 更新障碍物系统
     */
    update(deltaTime, playerZ) {
        // 生成新的障碍物
        this.spawnObstacles(playerZ);
        
        // 更新现有障碍物
        this.updateObstacles(deltaTime);
        
        // 清理远离的障碍物
        this.cleanupObstacles(playerZ);
    }

    /**
     * 生成障碍物
     */
    spawnObstacles(playerZ) {
        const spawnZ = playerZ - 200; // 在玩家前方200单位生成
        
        // 检查是否需要生成新障碍物
        if (spawnZ < this.lastSpawnZ - this.spawnDistance) {
            this.lastSpawnZ = spawnZ;
            
            // 随机决定是否生成障碍物
            if (Math.random() < Config.OBSTACLES.SPAWN_RATE) {
                this.createRandomObstacle(spawnZ);
            }
        }
    }

    /**
     * 创建随机障碍物
     */
    createRandomObstacle(z) {
        if (this.obstacles.length >= this.maxObstacles) return;

        // 随机选择障碍物类型
        const types = Object.keys(Config.OBSTACLES.TYPES);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        // 随机选择生成区域
        const spawnZones = Config.OBSTACLES.SPAWN_ZONES;
        const randomZone = spawnZones[Math.floor(Math.random() * spawnZones.length)];
        
        // 在区域内随机位置
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * randomZone.radius;
        
        const position = new THREE.Vector3(
            randomZone.x + Math.cos(angle) * radius,
            randomZone.y + Math.sin(angle) * radius,
            z
        );

        // 检查位置是否合适（不与隧道壁重叠）
        if (this.isValidPosition(position)) {
            this.createObstacle(randomType, position);
        }
    }

    /**
     * 检查位置是否有效
     */
    isValidPosition(position) {
        const distanceFromCenter = Math.sqrt(position.x * position.x + position.y * position.y);
        const tunnelRadius = Config.TUNNEL.RADIUS - Config.TUNNEL.WALL_THICKNESS;
        
        // 确保障碍物在隧道内，但不贴近边缘
        return distanceFromCenter < tunnelRadius - 1.5;
    }

    /**
     * 创建障碍物
     */
    createObstacle(type, position) {
        // 尝试从对象池获取
        let obstacle = this.getObstacleFromPool();
        
        if (obstacle) {
            // 重用现有障碍物
            obstacle.reset(type, position);
            obstacle.setActive(true);
            this.scene.add(obstacle.mesh);
        } else {
            // 创建新障碍物
            obstacle = new Obstacle(type, position);
            this.scene.add(obstacle.mesh);
        }
        
        this.obstacles.push(obstacle);
    }

    /**
     * 更新所有障碍物
     */
    updateObstacles(deltaTime) {
        this.obstacles.forEach(obstacle => {
            obstacle.update(deltaTime);
        });
    }

    /**
     * 清理远离的障碍物
     */
    cleanupObstacles(playerZ) {
        const cleanupDistance = 100; // 玩家后方100单位清理
        
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.getPosition().z > playerZ + cleanupDistance) {
                this.recycleObstacle(obstacle);
                return false;
            }
            return true;
        });
    }

    /**
     * 从对象池获取障碍物
     */
    getObstacleFromPool() {
        return this.obstaclePool.pop();
    }

    /**
     * 回收障碍物到对象池
     */
    recycleObstacle(obstacle) {
        obstacle.setActive(false);
        this.scene.remove(obstacle.mesh);
        
        // 添加到对象池
        if (this.obstaclePool.length < Config.PERFORMANCE.OBJECT_POOL_SIZE) {
            this.obstaclePool.push(obstacle);
        } else {
            obstacle.dispose();
        }
    }

    /**
     * 获取所有活跃障碍物
     */
    getActiveObstacles() {
        return this.obstacles.filter(obstacle => obstacle.isActive);
    }

    /**
     * 检测与指定边界框的碰撞
     */
    checkCollisions(boundingBox) {
        const collisions = [];
        
        this.obstacles.forEach(obstacle => {
            if (obstacle.isActive && boundingBox.intersectsBox(obstacle.getBoundingBox())) {
                collisions.push(obstacle);
            }
        });
        
        return collisions;
    }

    /**
     * 创建障碍物爆炸效果
     */
    createExplosionEffect(position) {
        const particleCount = 15;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = [];
        
        // 初始化爆炸粒子
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // 随机颜色
            colors[i3] = 1.0;     // R
            colors[i3 + 1] = Math.random() * 0.5; // G
            colors[i3 + 2] = 0.0; // B
            
            // 随机速度
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            ));
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 1.0
        });
        
        const explosion = new THREE.Points(geometry, material);
        this.scene.add(explosion);
        
        // 动画爆炸效果
        let life = 1.0;
        const animate = () => {
            life -= 0.03;
            
            if (life > 0) {
                const positions = explosion.geometry.attributes.position.array;
                
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    const velocity = velocities[i];
                    
                    positions[i3] += velocity.x * 0.1;
                    positions[i3 + 1] += velocity.y * 0.1;
                    positions[i3 + 2] += velocity.z * 0.1;
                }
                
                explosion.geometry.attributes.position.needsUpdate = true;
                explosion.material.opacity = life;
                
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
                explosion.geometry.dispose();
                explosion.material.dispose();
            }
        };
        
        animate();
    }

    /**
     * 移除指定障碍物
     */
    removeObstacle(obstacle) {
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
            this.recycleObstacle(obstacle);
        }
    }

    /**
     * 重置障碍物系统
     */
    reset() {
        // 清理所有障碍物
        this.obstacles.forEach(obstacle => {
            this.scene.remove(obstacle.mesh);
            obstacle.dispose();
        });
        
        // 清理对象池
        this.obstaclePool.forEach(obstacle => {
            obstacle.dispose();
        });
        
        this.obstacles = [];
        this.obstaclePool = [];
        this.lastSpawnZ = 0;
        
        console.log('障碍物系统已重置');
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            activeObstacles: this.obstacles.length,
            pooledObstacles: this.obstaclePool.length,
            lastSpawnZ: this.lastSpawnZ
        };
    }

    /**
     * 销毁障碍物管理器
     */
    dispose() {
        this.reset();
        console.log('障碍物管理器已销毁');
    }
} 