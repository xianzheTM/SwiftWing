/**
 * SwiftWing 场景管理系统
 * 负责Three.js渲染器、场景、相机等核心组件的初始化和管理
 */

import * as THREE from 'three';
import { Config } from './Config.js';

export class Scene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.container = null;
        this.clock = new THREE.Clock();
        
        // 性能监控
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 0;
        
        this.init();
    }

    /**
     * 初始化场景系统
     */
    init() {
        this.createContainer();
        this.createRenderer();
        this.createScene();
        this.createCamera();
        this.createLights();
        this.setupPostProcessing();
        this.handleResize();
        
        console.log('场景系统初始化完成');
    }

    /**
     * 创建渲染容器
     */
    createContainer() {
        this.container = document.getElementById('game-container');
        if (!this.container) {
            throw new Error('未找到游戏容器元素 #game-container');
        }
    }

    /**
     * 创建渲染器
     */
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });

        // 渲染器基础设置
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(Config.SCENE.BACKGROUND_COLOR);
        
        // 启用阴影
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 色调映射
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // 输出编码
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        this.container.appendChild(this.renderer.domElement);
    }

    /**
     * 创建场景
     */
    createScene() {
        this.scene = new THREE.Scene();
        
        // 添加雾效
        this.scene.fog = new THREE.Fog(
            Config.SCENE.BACKGROUND_COLOR,
            Config.SCENE.FOG_NEAR,
            Config.SCENE.FOG_FAR
        );
        
        // 添加环境贴图 (简单的渐变背景)
        this.createBackground();
    }

    /**
     * 创建渐变背景
     */
    createBackground() {
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;

        const uniforms = {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0x000510) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
        };

        const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);
    }

    /**
     * 创建相机
     */
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            Config.SCENE.FOV,
            window.innerWidth / window.innerHeight,
            Config.SCENE.NEAR_PLANE,
            Config.SCENE.FAR_PLANE
        );
        
        // 相机初始位置
        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 创建光照系统
     */
    createLights() {
        // 环境光 - 提供基础照明
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // 定向光 - 主光源
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 0.5);
        directionalLight.castShadow = true;
        
        // 阴影设置
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        
        this.scene.add(directionalLight);

        // 点光源 - 增强隧道内部照明
        const pointLight = new THREE.PointLight(0x00ffff, 0.5, 30);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);

        // 半球光 - 营造科幻氛围
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x000020, 0.2);
        this.scene.add(hemisphereLight);
    }

    /**
     * 设置后处理效果
     */
    setupPostProcessing() {
        // 这里预留后处理效果的位置
        // 在Phase 3中将实现Bloom、FXAA等效果
        console.log('后处理系统已准备就绪');
    }

    /**
     * 处理窗口大小调整
     */
    handleResize() {
        const onWindowResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(width, height);
            
            console.log(`窗口大小已调整: ${width}x${height}`);
        };

        window.addEventListener('resize', onWindowResize, false);
        
        // 初始调整
        onWindowResize();
    }

    /**
     * 渲染单帧
     */
    render() {
        // 更新性能统计
        this.updatePerformanceStats();
        
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 更新性能统计
     */
    updatePerformanceStats() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFPSUpdate >= 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            if (Config.DEBUG.SHOW_STATS) {
                console.log(`FPS: ${this.currentFPS}`);
            }
        }
    }

    /**
     * 添加对象到场景
     */
    add(object) {
        this.scene.add(object);
    }

    /**
     * 从场景移除对象
     */
    remove(object) {
        this.scene.remove(object);
    }

    /**
     * 获取渲染器
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * 获取场景
     */
    getScene() {
        return this.scene;
    }

    /**
     * 获取相机
     */
    getCamera() {
        return this.camera;
    }

    /**
     * 获取当前FPS
     */
    getFPS() {
        return this.currentFPS;
    }

    /**
     * 获取时钟
     */
    getClock() {
        return this.clock;
    }

    /**
     * 更新相机位置 (跟随玩家)
     */
    updateCameraPosition(playerPosition) {
        // 相机跟随逻辑 - 降低相机高度，获得更合适的视角
        const offset = { x: 0, y: 2, z: 10 };  // 相机在玩家后方10单位，上方2单位（从4降低到2）
        
        this.camera.position.x = playerPosition.x + offset.x;
        this.camera.position.y = playerPosition.y + offset.y;
        this.camera.position.z = playerPosition.z + offset.z;  // 玩家向负Z前进，相机在正Z方向
        
        // 相机看向玩家前方一点，让视野更朝前
        this.camera.lookAt(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z - 5  // 看向玩家前方5单位处
        );
    }

    /**
     * 设置相机震动效果
     */
    setCameraShake(intensity = 0.1, duration = 500) {
        const originalPosition = this.camera.position.clone();
        const startTime = performance.now();
        
        const shake = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                const currentIntensity = intensity * (1 - progress);
                this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * currentIntensity;
                this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * currentIntensity;
                
                requestAnimationFrame(shake);
            } else {
                this.camera.position.copy(originalPosition);
            }
        };
        
        shake();
    }

    /**
     * 销毁场景资源
     */
    dispose() {
        // 移除事件监听器
        window.removeEventListener('resize', this.handleResize);
        
        // 销毁渲染器
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
        
        // 清理场景中的对象
        while (this.scene.children.length > 0) {
            const child = this.scene.children[0];
            this.scene.remove(child);
            
            // 销毁几何体和材质
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        
        console.log('场景资源已销毁');
    }
} 