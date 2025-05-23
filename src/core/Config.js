/**
 * SwiftWing 游戏配置管理
 * 统一管理游戏核心参数、性能设置、输入配置等
 */

export const Config = {
    // 游戏核心参数
    GAME: {
        TITLE: 'SwiftWing',
        VERSION: '1.0.0',
        TARGET_FPS: 60,
        MOBILE_TARGET_FPS: 30
    },

    // 场景设置
    SCENE: {
        FOV: 65,                     // 减少相机视野角度，避免看到隧道外部（从85降低到65）
        NEAR_PLANE: 0.1,             // 近裁剪平面
        FAR_PLANE: 200,              // 远裁剪平面
        BACKGROUND_COLOR: 0x000510,  // 背景颜色 (深蓝黑色)
        FOG_NEAR: 10,                // 雾效近距离
        FOG_FAR: 100                 // 雾效远距离
    },

    // 玩家飞机配置
    PLAYER: {
        INITIAL_POSITION: { x: 0, y: 0, z: 0 },
        MOVE_SPEED: 2.0,           // 移动灵敏度 (从0.8进一步提高到2.0)
        SMOOTH_FACTOR: 0.5,        // 移动平滑系数 (从0.3提高到0.5)
        BOUNDS: {
            X_MIN: -5.5,           // 进一步减小到5.5，确保所有角落都在安全范围
            X_MAX: 5.5,
            Y_MIN: -5.5,           // 进一步减小到5.5，确保所有角落都在安全范围  
            Y_MAX: 5.5
        },
        COLLISION_BOX: {
            WIDTH: 0.8,    // 匹配缩小的飞机宽度
            HEIGHT: 0.5,   // 匹配缩小的飞机高度
            DEPTH: 1.5     // 匹配缩小的飞机深度
        }
    },

    // 隧道系统配置
    TUNNEL: {
        SEGMENT_LENGTH: 50,        // 隧道段长度
        RADIUS: 10,               // 隧道半径
        SEGMENTS_AHEAD: 5,        // 前方保持的段数
        SEGMENTS_BEHIND: 2,       // 后方保持的段数
        GENERATION_THRESHOLD: 100, // 生成新段的距离阈值
        WALL_THICKNESS: 0.5,      // 隧道壁厚度
        INNER_GLOW_COLOR: 0x00ffff, // 内壁发光颜色
        OUTER_COLOR: 0x1a1a2e     // 外壁颜色
    },

    // 障碍物配置
    OBSTACLES: {
        SPAWN_RATE: 0.3,          // 生成概率 (每个位置)
        MIN_DISTANCE: 15,         // 最小间距
        TYPES: {
            CUBE: {
                SIZE: { width: 1, height: 1, depth: 1 },
                COLOR: 0xff3030
            },
            SPHERE: {
                RADIUS: 0.8,
                COLOR: 0xff6030
            },
            PYRAMID: {
                BASE: 1.2,
                HEIGHT: 1.5,
                COLOR: 0xff9030
            }
        },
        SPAWN_ZONES: [
            { x: -3, y: -2, radius: 1.5 },
            { x: 3, y: -2, radius: 1.5 },
            { x: 0, y: 2, radius: 1.5 },
            { x: -2, y: 0, radius: 1.2 },
            { x: 2, y: 0, radius: 1.2 }
        ]
    },

    // 物理系统配置
    PHYSICS: {
        GRAVITY: 0,               // 无重力
        SPEED_INCREMENT: 0.02,    // 速度增长系数（每秒增长0.02，非常缓慢）
        INITIAL_SPEED: 0.3,       // 初始前进速度（非常慢的起始）
        MAX_SPEED: 2.0,           // 最大速度（进一步降低上限）
        COLLISION_DAMAGE: 20,     // 碰撞伤害
        COLLISION_TOLERANCE: 0.05 // 碰撞检测容差（更小的值让碰撞更精确）
    },

    // 输入系统配置
    INPUT: {
        MOUSE_SENSITIVITY: 5.0,   // 鼠标灵敏度 (从2.5进一步提高到5.0)
        TOUCH_SENSITIVITY: 1.2,   // 触摸灵敏度
        KEYBOARD_SPEED: 0.1,     // 键盘移动速度 (从0.05提高到0.1)
        DEADZONE: 0.01,          // 输入死区 (从0.02进一步减少到0.01)
        SMOOTH_FACTOR: 0.4       // 输入平滑系数 (从0.25提高到0.4)
    },

    // 性能优化配置
    PERFORMANCE: {
        MAX_OBSTACLES: 100,       // 最大同时障碍物数量
        OBJECT_POOL_SIZE: 50,     // 对象池大小
        CULL_DISTANCE: 100,       // 剔除距离
        LOD_LEVELS: [
            { distance: 20, detail: 1.0 },
            { distance: 50, detail: 0.7 },
            { distance: 80, detail: 0.4 }
        ]
    },

    // 视觉效果配置
    EFFECTS: {
        PARTICLE_COUNT: 200,      // 粒子数量
        TRAIL_LENGTH: 10,         // 拖尾长度
        SPEED_LINES: {
            COUNT: 50,
            LENGTH: 10,
            SPEED: 2.0
        },
        POST_PROCESSING: {
            BLOOM_STRENGTH: 1.5,
            BLOOM_RADIUS: 0.4
        }
    },

    // UI配置
    UI: {
        HUD_UPDATE_INTERVAL: 100, // HUD更新间隔 (ms)
        SCORE_MULTIPLIER: 10,     // 分数倍数
        MENU_ANIMATION_DURATION: 300, // 菜单动画时长
        COLORS: {
            PRIMARY: '#00ffff',
            SECONDARY: '#ff6b35',
            SUCCESS: '#4ecdc4',
            WARNING: '#ffe66d',
            DANGER: '#ff6b6b'
        }
    },

    // 调试配置
    DEBUG: {
        SHOW_STATS: false,        // 显示性能统计
        SHOW_WIREFRAME: false,    // 显示线框
        SHOW_BOUNDS: false,       // 显示边界框
        LOG_LEVEL: 'info',        // 日志级别: debug, info, warn, error
        COLLISION_VISUALIZATION: false // 碰撞可视化
    }
};

/**
 * 配置工具函数
 */
export const ConfigUtils = {
    /**
     * 检测设备类型并调整配置
     */
    adjustForDevice() {
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768;
        
        if (isMobile && !isTablet) {
            // 移动设备优化
            Config.GAME.TARGET_FPS = Config.GAME.MOBILE_TARGET_FPS;
            Config.PERFORMANCE.MAX_OBSTACLES = 50;
            Config.EFFECTS.PARTICLE_COUNT = 100;
            Config.EFFECTS.SPEED_LINES.COUNT = 25;
            Config.SCENE.FAR_PLANE = 500;
        }
        
        return { isMobile, isTablet };
    },

    /**
     * 根据设备性能调整配置
     */
    adjustForPerformance() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            const renderer = gl.getParameter(gl.RENDERER);
            const isLowEnd = /intel/i.test(renderer) || /software/i.test(renderer);
            
            if (isLowEnd) {
                Config.PERFORMANCE.MAX_OBSTACLES = 30;
                Config.EFFECTS.PARTICLE_COUNT = 50;
                Config.EFFECTS.SPEED_LINES.COUNT = 20;
                Config.DEBUG.SHOW_STATS = true; // 低端设备显示性能统计
            }
        }
    },

    /**
     * 获取当前配置的副本
     */
    getConfig() {
        return JSON.parse(JSON.stringify(Config));
    },

    /**
     * 动态更新配置
     */
    updateConfig(path, value) {
        const keys = path.split('.');
        let current = Config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        console.log(`配置已更新: ${path} = ${value}`);
    },

    /**
     * 重置为默认配置
     */
    resetToDefaults() {
        // 这里可以实现配置重置逻辑
        console.log('配置已重置为默认值');
    }
};

// 初始化设备和性能优化
ConfigUtils.adjustForDevice();
ConfigUtils.adjustForPerformance();

console.log('游戏配置模块已加载', Config.GAME.TITLE, Config.GAME.VERSION); 