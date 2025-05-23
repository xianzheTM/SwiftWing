/**
 * SwiftWing 隧道生成和管理系统
 * 实现无限隧道的动态生成、分段管理和视觉效果
 */

import * as THREE from 'three';
import { Config } from '../core/Config.js';

export class Tunnel {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];
        this.segmentPool = [];
        
        // 隧道状态
        this.currentZ = 0;
        this.lastGeneratedZ = 0;
        this.currentSpeed = Config.PHYSICS.INITIAL_SPEED;
        
        // 材质缓存
        this.materials = {};
        
        this.init();
    }

    /**
     * 初始化隧道系统
     */
    init() {
        this.createMaterials();
        this.generateInitialSegments();
        
        console.log('隧道系统初始化完成');
    }

    /**
     * 创建隧道材质
     */
    createMaterials() {
        // 内壁材质 - 使用稍微发光的材质确保可见
        this.materials.inner = new THREE.MeshLambertMaterial({
            color: Config.TUNNEL.INNER_GLOW_COLOR,
            emissive: new THREE.Color(Config.TUNNEL.INNER_GLOW_COLOR).multiplyScalar(0.05), // 少量发光确保可见
            side: THREE.BackSide,
            transparent: false
        });

        // 外壁结构材质 - 使用稍微发光的材质
        this.materials.outer = new THREE.MeshLambertMaterial({
            color: Config.TUNNEL.OUTER_COLOR,
            emissive: new THREE.Color(Config.TUNNEL.OUTER_COLOR).multiplyScalar(0.03), // 少量发光
            side: THREE.FrontSide,
            transparent: false
        });

        // 简化线框材质 - 静态不闪烁
        this.materials.wireframe = new THREE.MeshBasicMaterial({
            color: Config.TUNNEL.INNER_GLOW_COLOR,
            wireframe: true,
            transparent: false
        });

        // 调试材质
        if (Config.DEBUG.SHOW_WIREFRAME) {
            this.materials.debug = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true,
                transparent: true,
                opacity: 0.5
            });
        }
    }

    /**
     * 生成初始隧道段
     */
    generateInitialSegments() {
        console.log('开始生成初始隧道段...');
        
        // 增加总段数，确保完全覆盖
        const totalSegments = Config.TUNNEL.SEGMENTS_AHEAD + Config.TUNNEL.SEGMENTS_BEHIND + 4; // 再增加2段
        
        for (let i = 0; i < totalSegments; i++) {
            const z = -i * Config.TUNNEL.SEGMENT_LENGTH;
            console.log(`生成初始段 ${i}: z=${z}`);
            this.createSegment(z);
        }
        
        this.lastGeneratedZ = -(totalSegments - 1) * Config.TUNNEL.SEGMENT_LENGTH;
        console.log(`初始隧道段生成完成，共${this.segments.length}段，lastGeneratedZ=${this.lastGeneratedZ}`);
    }

    /**
     * 创建单个隧道段
     */
    createSegment(zPosition) {
        const segment = this.getSegmentFromPool();
        
        if (segment) {
            // 重用已有段
            segment.position.z = zPosition;
            segment.visible = true;
            this.segments.push(segment);  // 确保添加到segments数组
            this.scene.add(segment);      // 确保添加到场景
            console.log(`重用隧道段在 Z=${zPosition}, 总段数: ${this.segments.length}`);
        } else {
            // 创建新段
            const newSegment = this.buildSegmentGeometry(zPosition);
            this.segments.push(newSegment);
            this.scene.add(newSegment);
            console.log(`创建新隧道段在 Z=${zPosition}, 总段数: ${this.segments.length}`);
        }
    }

    /**
     * 构建隧道段几何体
     */
    buildSegmentGeometry(zPosition) {
        const group = new THREE.Group();
        group.position.z = zPosition;

        // 使用标准段长度，无重叠
        const segmentLength = Config.TUNNEL.SEGMENT_LENGTH;

        // 创建内壁圆筒
        const innerGeometry = new THREE.CylinderGeometry(
            Config.TUNNEL.RADIUS - Config.TUNNEL.WALL_THICKNESS,
            Config.TUNNEL.RADIUS - Config.TUNNEL.WALL_THICKNESS,
            segmentLength,
            16,
            1,
            true
        );
        
        // 旋转几何体使其沿Z轴
        innerGeometry.rotateX(Math.PI / 2);
        
        const innerMesh = new THREE.Mesh(innerGeometry, this.materials.inner);
        group.add(innerMesh);

        // 创建外壁结构
        const outerGeometry = new THREE.CylinderGeometry(
            Config.TUNNEL.RADIUS,
            Config.TUNNEL.RADIUS,
            segmentLength,
            16,
            1,
            true
        );
        
        outerGeometry.rotateX(Math.PI / 2);
        
        const outerMesh = new THREE.Mesh(outerGeometry, this.materials.outer);
        group.add(outerMesh);

        // 恢复简单的线框结构，提供视觉轮廓
        const wireframeGeometry = new THREE.CylinderGeometry(
            Config.TUNNEL.RADIUS - 0.2,
            Config.TUNNEL.RADIUS - 0.2,
            segmentLength,
            8,
            1,
            true
        );
        
        wireframeGeometry.rotateX(Math.PI / 2);
        
        const wireframeMesh = new THREE.Mesh(wireframeGeometry, this.materials.wireframe);
        group.add(wireframeMesh);

        return group;
    }

    /**
     * 添加支撑环结构
     */
    addSupportRings(group) {
        const ringCount = 3;
        const ringSpacing = Config.TUNNEL.SEGMENT_LENGTH / (ringCount + 1); // 使用原始段长度

        for (let i = 0; i < ringCount; i++) {
            const ring = this.createSupportRing();
            ring.position.z = -Config.TUNNEL.SEGMENT_LENGTH / 2 + (i + 1) * ringSpacing; // 使用原始段长度
            group.add(ring);
        }
    }

    /**
     * 创建支撑环
     */
    createSupportRing() {
        const ringGroup = new THREE.Group();
        
        // 主环
        const ringGeometry = new THREE.TorusGeometry(
            Config.TUNNEL.RADIUS - 0.3,
            0.1,
            8,
            16
        );
        
        const ringMaterial = new THREE.MeshLambertMaterial({
            color: Config.TUNNEL.INNER_GLOW_COLOR,
            emissive: new THREE.Color(Config.TUNNEL.INNER_GLOW_COLOR).multiplyScalar(0.3)
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ringGroup.add(ring);

        // 支撑梁
        const beamCount = 6;
        for (let i = 0; i < beamCount; i++) {
            // 添加角度偏移，避免支撑梁出现在垂直中心轴线上
            const angle = (i / beamCount) * Math.PI * 2 + Math.PI / 12; // 添加15度偏移
            const beam = this.createSupportBeam();
            beam.position.set(
                Math.cos(angle) * (Config.TUNNEL.RADIUS - 0.8),
                Math.sin(angle) * (Config.TUNNEL.RADIUS - 0.8),
                0
            );
            beam.rotation.z = angle;
            ringGroup.add(beam);
        }

        return ringGroup;
    }

    /**
     * 创建支撑梁
     */
    createSupportBeam() {
        const beamGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.1);
        const beamMaterial = new THREE.MeshLambertMaterial({
            color: Config.TUNNEL.OUTER_COLOR,
            emissive: new THREE.Color(Config.TUNNEL.OUTER_COLOR).multiplyScalar(0.2)
        });
        
        return new THREE.Mesh(beamGeometry, beamMaterial);
    }

    /**
     * 添加科幻装饰细节
     */
    addSciFiDetails(group) {
        // 添加发光条纹 - 临时禁用以测试竖线问题
        // this.addGlowStripes(group);
        
        // 添加数据板
        this.addDataPanels(group);
    }

    /**
     * 添加发光条纹
     */
    addGlowStripes(group) {
        const stripeCount = 4;
        
        for (let i = 0; i < stripeCount; i++) {
            // 添加角度偏移，避免条纹出现在垂直中心轴线上
            const angle = (i / stripeCount) * Math.PI * 2 + Math.PI / 8; // 添加22.5度偏移
            
            const stripeGeometry = new THREE.PlaneGeometry(0.2, Config.TUNNEL.SEGMENT_LENGTH); // 使用原始段长度
            const stripeMaterial = new THREE.MeshBasicMaterial({
                color: Config.TUNNEL.INNER_GLOW_COLOR,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.set(
                Math.cos(angle) * (Config.TUNNEL.RADIUS - 0.05),
                Math.sin(angle) * (Config.TUNNEL.RADIUS - 0.05),
                0
            );
            stripe.rotation.y = -angle + Math.PI / 2;
            
            group.add(stripe);
        }
    }

    /**
     * 添加数据面板
     */
    addDataPanels(group) {
        const panelCount = 8;
        
        for (let i = 0; i < panelCount; i++) {
            const angle = (i / panelCount) * Math.PI * 2;
            
            // 随机决定是否添加面板
            if (Math.random() > 0.6) {
                const panel = this.createDataPanel();
                panel.position.set(
                    Math.cos(angle) * (Config.TUNNEL.RADIUS - 0.2),
                    Math.sin(angle) * (Config.TUNNEL.RADIUS - 0.2),
                    (Math.random() - 0.5) * Config.TUNNEL.SEGMENT_LENGTH * 0.8 // 使用原始段长度
                );
                panel.rotation.y = -angle + Math.PI;
                
                group.add(panel);
            }
        }
    }

    /**
     * 创建数据面板
     */
    createDataPanel() {
        const panelGroup = new THREE.Group();
        
        // 面板背景
        const panelGeometry = new THREE.PlaneGeometry(1, 0.6);
        const panelMaterial = new THREE.MeshLambertMaterial({
            color: 0x001122,
            emissive: 0x000511,
            transparent: true,
            opacity: 0.8
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panelGroup.add(panel);

        // 发光边框
        const borderGeometry = new THREE.PlaneGeometry(1.1, 0.7);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: Config.TUNNEL.INNER_GLOW_COLOR,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.z = -0.01;
        panelGroup.add(border);

        return panelGroup;
    }

    /**
     * 更新隧道系统
     */
    update(deltaTime, playerZ) {
        this.currentZ = playerZ;
        this.updateSpeed(deltaTime);
        
        // 添加调试信息
        if (Math.floor(Date.now() / 1000) % 2 === 0 && Date.now() % 1000 < 50) {
            console.log(`隧道状态: 玩家Z=${playerZ.toFixed(2)}, 最后生成Z=${this.lastGeneratedZ}, 段数=${this.segments.length}`);
        }
        
        this.manageSegments();
        this.updateMaterials(deltaTime);
    }

    /**
     * 更新隧道速度
     */
    updateSpeed(deltaTime) {
        // 简化的线性增长，更容易控制
        const incrementPerSecond = Config.PHYSICS.SPEED_INCREMENT * deltaTime;
        
        this.currentSpeed += incrementPerSecond;
        this.currentSpeed = Math.min(this.currentSpeed, Config.PHYSICS.MAX_SPEED);
        
        // 确保速度不会低于初始速度
        this.currentSpeed = Math.max(this.currentSpeed, Config.PHYSICS.INITIAL_SPEED);
    }

    /**
     * 管理隧道段的生成和回收
     */
    manageSegments() {
        // 计算需要生成段的前方位置（玩家前方）
        const frontZ = this.currentZ - Config.TUNNEL.SEGMENTS_AHEAD * Config.TUNNEL.SEGMENT_LENGTH;
        
        // 不使用缓冲区，精确在需要的位置生成
        let generatedCount = 0;
        while (this.lastGeneratedZ > frontZ) {
            this.lastGeneratedZ -= Config.TUNNEL.SEGMENT_LENGTH;
            this.createSegment(this.lastGeneratedZ);
            generatedCount++;
            
            // 减少调试日志频率
            if (generatedCount <= 2) {
                console.log(`生成新隧道段: z=${this.lastGeneratedZ.toFixed(1)}, 玩家z=${this.currentZ.toFixed(1)}`);
            }
            
            // 防止无限循环
            if (generatedCount > 15) {
                console.error('隧道生成异常：检测到可能的无限循环，停止生成');
                break;
            }
        }
        
        // 回收玩家后方的段（保守回收策略）
        const backZ = this.currentZ + (Config.TUNNEL.SEGMENTS_BEHIND + 1) * Config.TUNNEL.SEGMENT_LENGTH;
        
        const beforeCount = this.segments.length;
        this.segments = this.segments.filter(segment => {
            if (segment.position.z > backZ) {
                this.recycleSegment(segment);
                return false;
            }
            return true;
        });
        
        const recycledCount = beforeCount - this.segments.length;
        if (recycledCount > 0) {
            console.log(`回收了${recycledCount}段，剩余${this.segments.length}段`);
        }
        
        // 警告段数过少
        if (this.segments.length < 5) {
            console.warn(`警告：隧道段数量过少 (${this.segments.length})，可能出现空隙`);
        }
    }

    /**
     * 从对象池获取隧道段
     */
    getSegmentFromPool() {
        const segment = this.segmentPool.pop();
        // 不在这里添加到segments数组，由createSegment统一处理
        return segment;
    }

    /**
     * 回收隧道段到对象池
     */
    recycleSegment(segment) {
        segment.visible = false;
        this.scene.remove(segment);
        this.segmentPool.push(segment);
    }

    /**
     * 更新材质动画效果
     */
    updateMaterials(deltaTime) {
        // 保持静态，不做动画，避免闪烁
    }

    /**
     * 获取隧道在指定位置的半径（可用于碰撞检测）
     */
    getRadiusAtPosition(z) {
        // 目前是固定半径，后续可以实现变化半径
        return Config.TUNNEL.RADIUS - Config.TUNNEL.WALL_THICKNESS;
    }

    /**
     * 检查点是否在隧道内
     */
    isInsideTunnel(position) {
        const distance = Math.sqrt(position.x * position.x + position.y * position.y);
        return distance < this.getRadiusAtPosition(position.z);
    }

    /**
     * 获取当前速度
     */
    getCurrentSpeed() {
        return this.currentSpeed;
    }

    /**
     * 重置隧道系统
     */
    reset() {
        this.currentZ = 0;
        this.lastGeneratedZ = 0;
        this.currentSpeed = Config.PHYSICS.INITIAL_SPEED;
        
        // 清理所有段
        this.segments.forEach(segment => {
            this.scene.remove(segment);
        });
        this.segments = [];
        this.segmentPool = [];
        
        // 重新生成初始段
        this.generateInitialSegments();
        
        console.log('隧道系统已重置');
    }

    /**
     * 销毁隧道系统
     */
    dispose() {
        // 清理所有段
        [...this.segments, ...this.segmentPool].forEach(segment => {
            this.scene.remove(segment);
            
            // 销毁几何体和材质
            segment.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material && child.material !== this.materials.inner && 
                    child.material !== this.materials.outer && 
                    child.material !== this.materials.wireframe) {
                    child.material.dispose();
                }
            });
        });
        
        // 销毁共享材质
        Object.values(this.materials).forEach(material => {
            material.dispose();
        });
        
        this.segments = [];
        this.segmentPool = [];
        
        console.log('隧道系统已销毁');
    }
} 