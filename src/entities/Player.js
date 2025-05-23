/**
 * SwiftWing 玩家飞机实体
 * 负责飞机的创建、移动控制、碰撞检测和视觉效果
 */

import * as THREE from 'three';
import { Config } from '../core/Config.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.engineTrail = null;
        
        // 位置和移动相关
        this.position = new THREE.Vector3(
            Config.PLAYER.INITIAL_POSITION.x,
            Config.PLAYER.INITIAL_POSITION.y,
            Config.PLAYER.INITIAL_POSITION.z
        );
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.targetPosition = new THREE.Vector3();
        
        // 输入状态
        this.inputState = {
            moveX: 0,
            moveY: 0
        };
        
        // 飞机倾斜效果
        this.tiltAmount = 0;
        this.maxTilt = Math.PI / 8; // 22.5度
        
        // 碰撞检测
        this.boundingBox = new THREE.Box3();
        this.collisionBox = null;
        
        // 状态管理
        this.health = 100;
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 1000; // 1秒无敌时间
        
        this.init();
    }

    /**
     * 初始化玩家飞机
     */
    init() {
        this.createMesh();
        this.createEngineTrail();
        this.createCollisionBox();
        this.updateBoundingBox();
        
        console.log('玩家飞机初始化完成');
    }

    /**
     * 创建飞机网格
     */
    createMesh() {
        // 创建飞机几何体 (简化的战斗机造型)
        const group = new THREE.Group();
        
        // 主机身
        const fuselageGeometry = new THREE.BoxGeometry(0.3, 0.2, 1.5);
        const fuselageMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00ff88,
            emissive: 0x003322
        });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        group.add(fuselage);
        
        // 机翼
        const wingGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.4);
        const wingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00cc66,
            emissive: 0x002211
        });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.z = 0.2;
        group.add(wings);
        
        // 尾翼
        const tailGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.1);
        const tailMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00aa44,
            emissive: 0x001100
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.z = 0.7;
        group.add(tail);
        
        // 驾驶舱
        const cockpitGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const cockpitMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4488ff,
            emissive: 0x112244,
            transparent: true,
            opacity: 0.8
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.1, -0.3);
        group.add(cockpit);
        
        // 设置整体属性
        group.position.copy(this.position);
        group.castShadow = true;
        group.receiveShadow = false;
        
        this.mesh = group;
        this.scene.add(this.mesh);
    }

    /**
     * 创建引擎尾迹效果
     */
    createEngineTrail() {
        // 粒子几何体
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // 初始化粒子属性
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 位置 (在飞机后方)
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = Math.random() * -3;
            
            // 颜色 (蓝色到白色渐变)
            const intensity = Math.random();
            colors[i3] = intensity * 0.5;     // R
            colors[i3 + 1] = intensity * 0.8; // G
            colors[i3 + 2] = 1.0;             // B
            
            // 大小
            sizes[i] = Math.random() * 0.1 + 0.05;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // 粒子材质
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.engineTrail = new THREE.Points(geometry, material);
        this.engineTrail.position.copy(this.position);
        this.scene.add(this.engineTrail);
    }

    /**
     * 创建碰撞检测盒
     */
    createCollisionBox() {
        if (Config.DEBUG.SHOW_BOUNDS) {
            const boxGeometry = new THREE.BoxGeometry(
                Config.PLAYER.COLLISION_BOX.WIDTH,
                Config.PLAYER.COLLISION_BOX.HEIGHT,
                Config.PLAYER.COLLISION_BOX.DEPTH
            );
            const boxMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            
            this.collisionBox = new THREE.Mesh(boxGeometry, boxMaterial);
            this.collisionBox.position.copy(this.position);
            this.scene.add(this.collisionBox);
        }
    }

    /**
     * 更新输入状态
     */
    updateInput(inputData) {
        this.inputState.moveX = inputData.moveX || 0;
        this.inputState.moveY = inputData.moveY || 0;
    }

    /**
     * 更新玩家位置和状态
     */
    update(deltaTime) {
        this.updateMovement(deltaTime);
        this.updateTilt(deltaTime);
        this.updateTrail(deltaTime);
        this.updateBoundingBox();
        this.updateInvulnerability(deltaTime);
        
        // 更新网格位置
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.z = this.tiltAmount;
        }
        
        // 更新碰撞盒位置
        if (this.collisionBox) {
            this.collisionBox.position.copy(this.position);
        }
        
        // 更新尾迹位置
        if (this.engineTrail) {
            this.engineTrail.position.copy(this.position);
        }
    }

    /**
     * 更新移动逻辑
     */
    updateMovement(deltaTime) {
        // 计算目标位置
        this.targetPosition.x = this.position.x + this.inputState.moveX * Config.PLAYER.MOVE_SPEED;
        this.targetPosition.y = this.position.y + this.inputState.moveY * Config.PLAYER.MOVE_SPEED;
        this.targetPosition.z = this.position.z;
        
        // 应用边界约束
        this.targetPosition.x = Math.max(
            Config.PLAYER.BOUNDS.X_MIN,
            Math.min(Config.PLAYER.BOUNDS.X_MAX, this.targetPosition.x)
        );
        this.targetPosition.y = Math.max(
            Config.PLAYER.BOUNDS.Y_MIN,
            Math.min(Config.PLAYER.BOUNDS.Y_MAX, this.targetPosition.y)
        );
        
        // 平滑移动到目标位置
        this.position.lerp(this.targetPosition, Config.PLAYER.SMOOTH_FACTOR);
        
        // 记录移动速度用于倾斜计算
        this.velocity.x = this.inputState.moveX * Config.PLAYER.MOVE_SPEED;
        this.velocity.y = this.inputState.moveY * Config.PLAYER.MOVE_SPEED;
    }

    /**
     * 更新飞机倾斜效果
     */
    updateTilt(deltaTime) {
        // 根据横向移动计算倾斜角度
        const targetTilt = -this.velocity.x * this.maxTilt * 2;
        
        // 平滑过渡到目标倾斜角度
        this.tiltAmount += (targetTilt - this.tiltAmount) * 0.1;
    }

    /**
     * 更新引擎尾迹
     */
    updateTrail(deltaTime) {
        if (!this.engineTrail) return;
        
        const positions = this.engineTrail.geometry.attributes.position.array;
        const colors = this.engineTrail.geometry.attributes.color.array;
        
        // 更新每个粒子
        for (let i = 0; i < positions.length; i += 3) {
            // 向后移动粒子
            positions[i + 2] -= deltaTime * 5; // Z轴向后
            
            // 重置超出范围的粒子
            if (positions[i + 2] < -5) {
                positions[i + 2] = 0.5;
                positions[i] = (Math.random() - 0.5) * 0.2; // 轻微随机X偏移
                positions[i + 1] = (Math.random() - 0.5) * 0.1; // 轻微随机Y偏移
                
                // 重置颜色
                const intensity = Math.random();
                colors[i] = intensity * 0.5;
                colors[i + 1] = intensity * 0.8;
                colors[i + 2] = 1.0;
            }
        }
        
        // 标记需要更新
        this.engineTrail.geometry.attributes.position.needsUpdate = true;
        this.engineTrail.geometry.attributes.color.needsUpdate = true;
    }

    /**
     * 更新碰撞检测边界框
     */
    updateBoundingBox() {
        const halfWidth = Config.PLAYER.COLLISION_BOX.WIDTH / 2;
        const halfHeight = Config.PLAYER.COLLISION_BOX.HEIGHT / 2;
        const halfDepth = Config.PLAYER.COLLISION_BOX.DEPTH / 2;
        
        this.boundingBox.setFromCenterAndSize(
            this.position,
            new THREE.Vector3(
                Config.PLAYER.COLLISION_BOX.WIDTH,
                Config.PLAYER.COLLISION_BOX.HEIGHT,
                Config.PLAYER.COLLISION_BOX.DEPTH
            )
        );
    }

    /**
     * 更新无敌状态
     */
    updateInvulnerability(deltaTime) {
        if (this.isInvulnerable) {
            this.invulnerabilityDuration -= deltaTime * 1000;
            
            if (this.invulnerabilityDuration <= 0) {
                this.isInvulnerable = false;
                this.invulnerabilityDuration = 1000;
                
                // 恢复正常材质
                if (this.mesh) {
                    this.mesh.children.forEach(child => {
                        if (child.material) {
                            child.material.transparent = false;
                            child.material.opacity = 1.0;
                        }
                    });
                }
            } else {
                // 闪烁效果
                const opacity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
                if (this.mesh) {
                    this.mesh.children.forEach(child => {
                        if (child.material) {
                            child.material.transparent = true;
                            child.material.opacity = opacity;
                        }
                    });
                }
            }
        }
    }

    /**
     * 处理碰撞
     */
    onCollision(obstacle) {
        if (this.isInvulnerable) return false;
        
        // 减少生命值
        this.health -= 20;
        
        // 进入无敌状态
        this.isInvulnerable = true;
        this.invulnerabilityDuration = 1000;
        
        // 视觉反馈
        this.createExplosionEffect();
        
        console.log(`玩家受到伤害，剩余生命值: ${this.health}`);
        
        return true; // 碰撞已处理
    }

    /**
     * 创建爆炸特效
     */
    createExplosionEffect() {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        // 初始化爆炸粒子
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 在飞机位置创建粒子
            positions[i3] = this.position.x;
            positions[i3 + 1] = this.position.y;
            positions[i3 + 2] = this.position.z;
            
            // 随机速度方向
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xff4444,
            size: 0.2,
            transparent: true,
            opacity: 1.0
        });
        
        const explosion = new THREE.Points(geometry, material);
        this.scene.add(explosion);
        
        // 动画爆炸效果
        let life = 1.0;
        const animate = () => {
            life -= 0.02;
            
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
     * 获取碰撞边界框
     */
    getBoundingBox() {
        return this.boundingBox;
    }

    /**
     * 获取位置
     */
    getPosition() {
        return this.position;
    }

    /**
     * 获取生命值
     */
    getHealth() {
        return this.health;
    }

    /**
     * 是否存活
     */
    isAlive() {
        return this.health > 0;
    }

    /**
     * 重置玩家状态
     */
    reset() {
        this.position.copy(Config.PLAYER.INITIAL_POSITION);
        this.velocity.set(0, 0, 0);
        this.health = 100;
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 1000;
        this.tiltAmount = 0;
        
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.z = 0;
        }
        
        console.log('玩家状态已重置');
    }

    /**
     * 销毁玩家对象
     */
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        
        if (this.engineTrail) {
            this.scene.remove(this.engineTrail);
            this.engineTrail.geometry.dispose();
            this.engineTrail.material.dispose();
        }
        
        if (this.collisionBox) {
            this.scene.remove(this.collisionBox);
            this.collisionBox.geometry.dispose();
            this.collisionBox.material.dispose();
        }
        
        console.log('玩家对象已销毁');
    }
} 