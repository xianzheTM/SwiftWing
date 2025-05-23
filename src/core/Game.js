/**
 * SwiftWing 主游戏控制器
 * 负责协调所有系统模块，管理游戏状态和游戏循环
 */

import { Scene } from './Scene.js';
import { Config } from './Config.js';
import { Player } from '../entities/Player.js';
import { Tunnel } from '../entities/Tunnel.js';
import { ObstacleManager } from '../entities/Obstacle.js';
import { InputManager } from '../systems/InputManager.js';
import { PhysicsEngine } from '../systems/PhysicsEngine.js';

// 游戏状态枚举
export const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

export class Game {
    constructor() {
        // 游戏状态
        this.currentState = GameState.LOADING;
        this.isRunning = false;
        this.isPaused = false;
        
        // 核心系统
        this.scene = null;
        this.inputManager = null;
        this.physicsEngine = null;
        
        // 游戏实体
        this.player = null;
        this.tunnel = null;
        this.obstacleManager = null;
        
        // 游戏数据
        this.score = 0;
        this.gameTime = 0;
        this.startTime = 0;
        
        // 性能监控
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 0;
        
        // UI元素
        this.hudElements = {};
        
        this.init();
    }

    /**
     * 初始化游戏
     */
    async init() {
        try {
            console.log('初始化SwiftWing游戏...');
            
            // 初始化核心系统
            await this.initializeSystems();
            
            // 初始化游戏实体
            this.initializeEntities();
            
            // 初始化UI
            this.initializeUI();
            
            // 设置事件监听
            this.setupEventListeners();
            
            this.currentState = GameState.MENU;
            console.log('游戏初始化完成');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
        }
    }

    /**
     * 初始化核心系统
     */
    async initializeSystems() {
        // 初始化场景（优先，因为需要创建Canvas）
        this.scene = new Scene();
        
        // 初始化输入管理器
        this.inputManager = new InputManager();
        
        // 将Canvas元素传递给输入管理器
        const canvas = this.scene.getRenderer().domElement;
        this.inputManager.setCanvasElement(canvas);
        
        // 初始化物理引擎
        this.physicsEngine = new PhysicsEngine();
        
        console.log('核心系统初始化完成');
    }

    /**
     * 初始化游戏实体
     */
    initializeEntities() {
        const sceneObj = this.scene.getScene();
        
        // 创建隧道
        this.tunnel = new Tunnel(sceneObj);
        
        // 创建玩家
        this.player = new Player(sceneObj);
        
        // 创建障碍物管理器
        this.obstacleManager = new ObstacleManager(sceneObj);
        
        console.log('游戏实体初始化完成');
    }

    /**
     * 初始化UI
     */
    initializeUI() {
        // 获取HUD元素
        this.hudElements = {
            score: document.getElementById('score'),
            health: document.getElementById('health'),
            speed: document.getElementById('speed'),
            time: document.getElementById('time')
        };
        
        // 获取菜单元素
        this.menuElements = {
            startButton: document.getElementById('start-button'),
            restartButton: document.getElementById('restart-button'),
            mainMenu: document.getElementById('main-menu'),
            gameOverMenu: document.getElementById('game-over-menu'),
            finalScore: document.getElementById('final-score'),
            finalTime: document.getElementById('final-time')
        };
        
        // 设置初始UI状态
        this.updateUI();
        this.showMenu();
        
        console.log('UI初始化完成');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 开始游戏按钮
        if (this.menuElements.startButton) {
            this.menuElements.startButton.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        // 重新开始按钮
        if (this.menuElements.restartButton) {
            this.menuElements.restartButton.addEventListener('click', () => {
                this.restartGame();
            });
        }
        
        // 键盘快捷键
        window.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    if (this.currentState === GameState.MENU) {
                        this.startGame();
                    } else if (this.currentState === GameState.PLAYING || this.currentState === GameState.PAUSED) {
                        this.togglePause();
                    } else if (this.currentState === GameState.GAME_OVER) {
                        this.restartGame();
                    }
                    event.preventDefault();
                    break;
                    
                case 'Escape':
                    if (this.currentState === GameState.PLAYING || this.currentState === GameState.PAUSED) {
                        this.togglePause();
                    }
                    break;
            }
        });
        
        // 窗口失去焦点时暂停
        window.addEventListener('blur', () => {
            if (this.currentState === GameState.PLAYING) {
                this.pauseGame();
            }
        });
        
        console.log('事件监听器设置完成');
    }

    /**
     * 开始游戏
     */
    startGame() {
        console.log('开始游戏');
        
        this.currentState = GameState.PLAYING;
        this.isRunning = true;
        this.isPaused = false;
        
        // 重置游戏数据
        this.score = 0;
        this.gameTime = 0;
        this.startTime = Date.now();
        
        // 重置游戏实体
        this.player.reset();
        this.tunnel.reset();
        this.obstacleManager.reset();
        this.physicsEngine.reset();
        
        // 隐藏菜单，显示HUD
        this.hideMenu();
        this.showHUD();
        
        // 开始游戏循环
        this.startGameLoop();
    }

    /**
     * 暂停/继续游戏
     */
    togglePause() {
        if (this.currentState === GameState.PLAYING) {
            this.pauseGame();
        } else if (this.currentState === GameState.PAUSED) {
            this.resumeGame();
        }
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        console.log('游戏暂停');
        this.currentState = GameState.PAUSED;
        this.isPaused = true;
        
        // 显示暂停菜单或提示
        this.showPauseIndicator();
    }

    /**
     * 继续游戏
     */
    resumeGame() {
        console.log('游戏继续');
        this.currentState = GameState.PLAYING;
        this.isPaused = false;
        
        // 隐藏暂停提示
        this.hidePauseIndicator();
    }

    /**
     * 游戏结束
     */
    gameOver() {
        console.log('游戏结束');
        
        this.currentState = GameState.GAME_OVER;
        this.isRunning = false;
        this.isPaused = false;
        
        // 计算最终成绩
        const finalTime = (Date.now() - this.startTime) / 1000;
        this.gameTime = finalTime;
        
        // 更新最终分数显示
        if (this.menuElements.finalScore) {
            this.menuElements.finalScore.textContent = this.score;
        }
        if (this.menuElements.finalTime) {
            this.menuElements.finalTime.textContent = finalTime.toFixed(2) + 's';
        }
        
        // 隐藏HUD，显示游戏结束菜单
        this.hideHUD();
        this.showGameOverMenu();
        
        // 保存最高分（简单的本地存储）
        this.saveHighScore();
    }

    /**
     * 重新开始游戏
     */
    restartGame() {
        console.log('重新开始游戏');
        this.hideGameOverMenu();
        this.startGame();
    }

    /**
     * 开始游戏循环
     */
    startGameLoop() {
        const animate = (currentTime) => {
            if (!this.isRunning) return;
            
            const deltaTime = this.scene.getClock().getDelta();
            
            if (!this.isPaused) {
                this.update(deltaTime);
            }
            
            this.render();
            
            // 更新性能统计
            this.updatePerformanceStats();
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * 更新游戏逻辑
     */
    update(deltaTime) {
        // 更新输入
        this.inputManager.update(deltaTime);
        const inputState = this.inputManager.getInputState();
        
        // 更新玩家输入
        this.player.updateInput(inputState);
        
        // 更新游戏实体
        this.player.update(deltaTime);
        this.tunnel.update(deltaTime, this.player.getPosition().z);
        this.obstacleManager.update(deltaTime, this.player.getPosition().z);
        
        // 更新物理
        const gameObjects = {
            player: this.player,
            tunnel: this.tunnel,
            obstacleManager: this.obstacleManager
        };
        this.physicsEngine.update(deltaTime, gameObjects);
        
        // 更新相机跟随
        this.scene.updateCameraPosition(this.player.getPosition());
        
        // 更新分数
        this.updateScore(deltaTime);
        
        // 检查游戏结束条件
        this.checkGameOverConditions();
        
        // 更新UI
        this.updateUI();
    }

    /**
     * 渲染游戏
     */
    render() {
        this.scene.render();
    }

    /**
     * 更新分数
     */
    updateScore(deltaTime) {
        // 基于时间和速度计算分数
        const speedMultiplier = this.tunnel.getCurrentSpeed() * 10;
        const timeBonus = deltaTime * Config.UI.SCORE_MULTIPLIER;
        
        this.score += Math.floor(timeBonus * speedMultiplier);
    }

    /**
     * 检查游戏结束条件
     */
    checkGameOverConditions() {
        // 检查玩家生命值
        if (!this.player.isAlive()) {
            this.gameOver();
            return;
        }
        
        // 其他游戏结束条件可以在这里添加
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        if (this.hudElements.score) {
            this.hudElements.score.textContent = this.score;
        }
        
        if (this.hudElements.health) {
            this.hudElements.health.textContent = this.player.getHealth() + '%';
        }
        
        if (this.hudElements.speed) {
            const speed = Math.round(this.tunnel.getCurrentSpeed() * 100);
            this.hudElements.speed.textContent = speed;
        }
        
        if (this.hudElements.time) {
            const currentTime = (Date.now() - this.startTime) / 1000;
            this.hudElements.time.textContent = currentTime.toFixed(1) + 's';
        }
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
                console.log(`FPS: ${this.currentFPS}`, this.physicsEngine.getStats());
            }
        }
    }

    /**
     * UI显示控制方法
     */
    showMenu() {
        if (this.menuElements.mainMenu) {
            this.menuElements.mainMenu.style.display = 'flex';
        }
    }

    hideMenu() {
        if (this.menuElements.mainMenu) {
            this.menuElements.mainMenu.style.display = 'none';
        }
    }

    showGameOverMenu() {
        if (this.menuElements.gameOverMenu) {
            this.menuElements.gameOverMenu.style.display = 'flex';
        }
    }

    hideGameOverMenu() {
        if (this.menuElements.gameOverMenu) {
            this.menuElements.gameOverMenu.style.display = 'none';
        }
    }

    showHUD() {
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'flex';
    }

    hideHUD() {
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'none';
    }

    showPauseIndicator() {
        const pauseIndicator = document.getElementById('pause-indicator');
        if (pauseIndicator) {
            pauseIndicator.style.display = 'flex';
        }
        console.log('显示暂停指示器');
    }

    hidePauseIndicator() {
        const pauseIndicator = document.getElementById('pause-indicator');
        if (pauseIndicator) {
            pauseIndicator.style.display = 'none';
        }
        console.log('隐藏暂停指示器');
    }

    /**
     * 保存最高分
     */
    saveHighScore() {
        const currentHighScore = localStorage.getItem('swiftwing-highscore') || 0;
        if (this.score > currentHighScore) {
            localStorage.setItem('swiftwing-highscore', this.score);
            console.log('新纪录！最高分:', this.score);
        }
    }

    /**
     * 获取游戏统计信息
     */
    getGameStats() {
        return {
            currentState: this.currentState,
            score: this.score,
            gameTime: this.gameTime,
            playerHealth: this.player ? this.player.getHealth() : 0,
            currentSpeed: this.tunnel ? this.tunnel.getCurrentSpeed() : 0,
            fps: this.currentFPS,
            obstacleStats: this.obstacleManager ? this.obstacleManager.getStats() : {},
            physicsStats: this.physicsEngine ? this.physicsEngine.getStats() : {}
        };
    }

    /**
     * 销毁游戏
     */
    dispose() {
        console.log('销毁游戏...');
        
        // 停止游戏循环
        this.isRunning = false;
        
        // 销毁各个系统
        if (this.scene) this.scene.dispose();
        if (this.inputManager) this.inputManager.dispose();
        if (this.physicsEngine) this.physicsEngine.dispose();
        
        // 销毁游戏实体
        if (this.player) this.player.dispose();
        if (this.tunnel) this.tunnel.dispose();
        if (this.obstacleManager) this.obstacleManager.dispose();
        
        console.log('游戏已销毁');
    }
} 