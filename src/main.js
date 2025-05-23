/**
 * SwiftWing 应用入口点
 * 负责启动游戏应用程序
 */

import { Game } from './core/Game.js';
import { Config } from './core/Config.js';

class SwiftWingApp {
    constructor() {
        this.game = null;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * 初始化应用程序
     */
    async init() {
        try {
            console.log('SwiftWing启动中...');
            
            // 显示加载界面
            this.showLoadingScreen();
            
            // 等待DOM完全加载
            await this.waitForDOMReady();
            
            // 检查浏览器兼容性
            this.checkBrowserCompatibility();
            
            // 初始化游戏
            this.game = new Game();
            
            // 等待游戏初始化完成
            await this.waitForGameReady();
            
            this.isInitialized = true;
            
            // 隐藏加载界面
            this.hideLoadingScreen();
            
            console.log('SwiftWing启动完成！');
            
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    /**
     * 等待DOM准备就绪
     */
    waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * 检查浏览器兼容性
     */
    checkBrowserCompatibility() {
        const requirements = {
            webgl: this.checkWebGLSupport(),
            es6: this.checkES6Support(),
            modules: this.checkModuleSupport()
        };

        console.log('浏览器兼容性检查:', requirements);

        // 检查关键功能
        if (!requirements.webgl) {
            throw new Error('您的浏览器不支持WebGL，无法运行游戏。请更新浏览器或使用支持WebGL的浏览器。');
        }

        if (!requirements.es6) {
            throw new Error('您的浏览器不支持ES6，无法运行游戏。请更新浏览器。');
        }

        // 性能警告
        this.checkPerformanceWarnings();
    }

    /**
     * 检查WebGL支持
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!context;
        } catch (e) {
            return false;
        }
    }

    /**
     * 检查ES6支持
     */
    checkES6Support() {
        try {
            // 测试箭头函数、类、模板字符串等ES6特性
            return typeof Symbol !== 'undefined' && 
                   typeof Promise !== 'undefined' &&
                   typeof Map !== 'undefined';
        } catch (e) {
            return false;
        }
    }

    /**
     * 检查模块支持
     */
    checkModuleSupport() {
        return 'noModule' in HTMLScriptElement.prototype;
    }

    /**
     * 检查性能警告
     */
    checkPerformanceWarnings() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                console.log('GPU信息:', renderer);
                
                // 检查是否为软件渲染
                if (renderer.includes('Software') || renderer.includes('Microsoft')) {
                    console.warn('检测到软件渲染，游戏性能可能受影响');
                    this.showPerformanceWarning();
                }
            }
        }
    }

    /**
     * 等待游戏准备就绪
     */
    waitForGameReady() {
        return new Promise((resolve) => {
            // 简单等待游戏初始化
            setTimeout(resolve, 1000);
        });
    }

    /**
     * 显示加载界面
     */
    showLoadingScreen() {
        // 创建加载界面
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <h1>SwiftWing</h1>
                <div class="loading-spinner"></div>
                <p>正在加载游戏...</p>
            </div>
        `;
        
        // 添加加载样式
        const style = document.createElement('style');
        style.textContent = `
            #loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: Arial, sans-serif;
                color: white;
            }
            
            .loading-content {
                text-align: center;
            }
            
            .loading-content h1 {
                font-size: 3em;
                margin-bottom: 30px;
                color: #00ffff;
                text-shadow: 0 0 20px #00ffff;
            }
            
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid #333;
                border-top: 3px solid #00ffff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-content p {
                font-size: 1.2em;
                margin-top: 20px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(loadingScreen);
    }

    /**
     * 隐藏加载界面
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.transition = 'opacity 0.5s ease-out';
            loadingScreen.style.opacity = '0';
            
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }

    /**
     * 显示性能警告
     */
    showPerformanceWarning() {
        console.warn('性能警告：检测到低性能GPU，建议降低画质设置');
        
        // 自动调整配置以提升性能
        Config.PERFORMANCE.AUTO_QUALITY = true;
        Config.VISUAL_EFFECTS.PARTICLES = false;
        Config.VISUAL_EFFECTS.POST_PROCESSING = false;
    }

    /**
     * 处理初始化错误
     */
    handleInitializationError(error) {
        console.error('SwiftWing初始化失败:', error);
        
        // 隐藏加载界面
        this.hideLoadingScreen();
        
        // 显示错误信息
        this.showErrorScreen(error.message);
    }

    /**
     * 显示错误界面
     */
    showErrorScreen(message) {
        const errorScreen = document.createElement('div');
        errorScreen.id = 'error-screen';
        errorScreen.innerHTML = `
            <div class="error-content">
                <h1>😞 哎呀！</h1>
                <h2>游戏无法启动</h2>
                <p class="error-message">${message}</p>
                <div class="error-solutions">
                    <h3>建议解决方案：</h3>
                    <ul>
                        <li>刷新页面重试</li>
                        <li>更新您的浏览器到最新版本</li>
                        <li>确保浏览器支持WebGL</li>
                        <li>尝试关闭其他占用GPU的程序</li>
                    </ul>
                </div>
                <button onclick="location.reload()">重新加载</button>
            </div>
        `;
        
        // 添加错误样式
        const style = document.createElement('style');
        style.textContent = `
            #error-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #2d1b1b 0%, #5a2a2a 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: Arial, sans-serif;
                color: white;
            }
            
            .error-content {
                text-align: center;
                max-width: 600px;
                padding: 40px;
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                border: 1px solid #ff6b6b;
            }
            
            .error-content h1 {
                font-size: 3em;
                margin-bottom: 20px;
            }
            
            .error-content h2 {
                color: #ff6b6b;
                margin-bottom: 20px;
            }
            
            .error-message {
                font-size: 1.1em;
                margin-bottom: 30px;
                color: #ffaaaa;
            }
            
            .error-solutions {
                text-align: left;
                margin-bottom: 30px;
            }
            
            .error-solutions ul {
                margin-left: 20px;
            }
            
            .error-solutions li {
                margin-bottom: 10px;
            }
            
            button {
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 12px 30px;
                font-size: 1.1em;
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.3s;
            }
            
            button:hover {
                background: #ff5252;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(errorScreen);
    }

    /**
     * 获取应用状态
     */
    getAppStatus() {
        return {
            isInitialized: this.isInitialized,
            hasGame: !!this.game,
            gameStats: this.game ? this.game.getGameStats() : null
        };
    }

    /**
     * 销毁应用
     */
    dispose() {
        if (this.game) {
            this.game.dispose();
            this.game = null;
        }
        
        this.isInitialized = false;
        console.log('SwiftWing应用已销毁');
    }
}

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
});

// 启动应用
let app;

// 等待页面加载完成后启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new SwiftWingApp();
    });
} else {
    app = new SwiftWingApp();
}

// 导出供调试使用
window.SwiftWingApp = app;

export default SwiftWingApp; 