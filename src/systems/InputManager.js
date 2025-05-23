/**
 * SwiftWing 输入管理系统
 * 统一处理鼠标、键盘、触摸等输入，提供标准化的输入数据
 */

import { Config } from '../core/Config.js';

export class InputManager {
    constructor() {
        // 输入状态
        this.inputState = {
            moveX: 0,
            moveY: 0,
            isActive: false
        };
        
        // 鼠标状态
        this.mouse = {
            x: 0,
            y: 0,
            lastX: 0,
            lastY: 0,
            deltaX: 0,
            deltaY: 0,
            isPressed: false
        };
        
        // 键盘状态
        this.keys = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // 触摸状态
        this.touch = {
            x: 0,
            y: 0,
            startX: 0,
            startY: 0,
            isActive: false
        };
        
        // 设备检测
        this.deviceInfo = this.detectDevice();
        
        // 输入平滑
        this.smoothedInput = { x: 0, y: 0 };
        
        // Canvas元素缓存
        this.canvasElement = null;
        
        this.init();
    }

    /**
     * 初始化输入系统
     */
    init() {
        // 延迟初始化，确保DOM元素已经创建
        setTimeout(() => {
            this.findCanvasElement();
            this.setupMouseInput();
            this.setupKeyboardInput();
            this.setupTouchInput();
            this.setupPointerLock();
            
            console.log('输入管理系统初始化完成', this.deviceInfo);
        }, 100);
    }

    /**
     * 查找Canvas元素
     */
    findCanvasElement() {
        // 按优先级查找Canvas元素
        this.canvasElement = 
            document.querySelector('#game-container canvas') ||  // 优先查找游戏容器内的canvas
            document.querySelector('canvas') ||                  // 然后查找任意canvas
            document.getElementById('game-container') ||         // 退而求其次使用游戏容器
            document.body;                                       // 最后使用body
        
        if (this.canvasElement && this.canvasElement.tagName === 'CANVAS') {
            console.log('找到Canvas元素:', this.canvasElement);
        } else {
            console.log('未找到Canvas，使用容器元素:', this.canvasElement);
        }
        
        return this.canvasElement;
    }

    /**
     * 检测设备类型
     */
    detectDevice() {
        const userAgent = navigator.userAgent;
        return {
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            isTablet: /iPad|Android/i.test(userAgent) && window.innerWidth > 768,
            hasTouch: 'ontouchstart' in window,
            hasMouse: window.matchMedia('(pointer: fine)').matches,
            hasAccelerometer: 'DeviceMotionEvent' in window
        };
    }

    /**
     * 设置鼠标输入
     */
    setupMouseInput() {
        if (!this.canvasElement) {
            console.warn('Canvas元素未找到，鼠标输入可能不工作');
            return;
        }
        
        // 鼠标移动事件
        this.canvasElement.addEventListener('mousemove', (event) => {
            if (!this.deviceInfo.hasMouse) return;
            
            this.updateMousePosition(event);
            this.updateInputFromMouse();
        });
        
        // 鼠标按下/释放
        this.canvasElement.addEventListener('mousedown', (event) => {
            this.mouse.isPressed = true;
            this.inputState.isActive = true;
            event.preventDefault();
        });
        
        this.canvasElement.addEventListener('mouseup', (event) => {
            this.mouse.isPressed = false;
        });
        
        // 鼠标离开窗口
        this.canvasElement.addEventListener('mouseleave', () => {
            this.inputState.isActive = false;
            this.resetInput();
        });
        
        console.log('鼠标输入事件已绑定到:', this.canvasElement.tagName);
    }

    /**
     * 设置键盘输入
     */
    setupKeyboardInput() {
        // 键盘按下
        window.addEventListener('keydown', (event) => {
            this.handleKeyDown(event.code);
            this.updateInputFromKeyboard();
            event.preventDefault();
        });
        
        // 键盘释放
        window.addEventListener('keyup', (event) => {
            this.handleKeyUp(event.code);
            this.updateInputFromKeyboard();
        });
        
        // 失去焦点时重置键盘状态
        window.addEventListener('blur', () => {
            this.resetKeyboard();
        });
    }

    /**
     * 设置触摸输入
     */
    setupTouchInput() {
        if (!this.deviceInfo.hasTouch || !this.canvasElement) return;
        
        // 触摸开始
        this.canvasElement.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];
            this.touch.startX = touch.clientX;
            this.touch.startY = touch.clientY;
            this.touch.x = touch.clientX;
            this.touch.y = touch.clientY;
            this.touch.isActive = true;
            this.inputState.isActive = true;
            
            event.preventDefault();
        });
        
        // 触摸移动
        this.canvasElement.addEventListener('touchmove', (event) => {
            if (!this.touch.isActive) return;
            
            const touch = event.touches[0];
            this.touch.x = touch.clientX;
            this.touch.y = touch.clientY;
            
            this.updateInputFromTouch();
            event.preventDefault();
        });
        
        // 触摸结束
        this.canvasElement.addEventListener('touchend', (event) => {
            this.touch.isActive = false;
            this.inputState.isActive = false;
            this.resetInput();
            event.preventDefault();
        });
        
        // 触摸取消
        this.canvasElement.addEventListener('touchcancel', (event) => {
            this.touch.isActive = false;
            this.inputState.isActive = false;
            this.resetInput();
        });
        
        console.log('触摸输入事件已绑定');
    }

    /**
     * 设置指针锁定（可选的高级鼠标控制）
     */
    setupPointerLock() {
        if (!this.canvasElement || this.canvasElement.tagName !== 'CANVAS') return;
        
        // 双击进入指针锁定模式
        this.canvasElement.addEventListener('dblclick', () => {
            if (this.deviceInfo.hasMouse) {
                this.canvasElement.requestPointerLock();
            }
        });
        
        // 指针锁定状态变化
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.canvasElement) {
                console.log('进入指针锁定模式');
            } else {
                console.log('退出指针锁定模式');
            }
        });
    }

    /**
     * 更新鼠标位置
     */
    updateMousePosition(event) {
        const rect = event.target.getBoundingClientRect();
        
        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;
        
        // 标准化坐标到[-1, 1]范围
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // 计算鼠标移动增量
        this.mouse.deltaX = this.mouse.x - this.mouse.lastX;
        this.mouse.deltaY = this.mouse.y - this.mouse.lastY;
    }

    /**
     * 从鼠标输入更新移动状态
     */
    updateInputFromMouse() {
        // 鼠标移动时自动激活输入状态
        this.inputState.isActive = true;
        
        // 使用鼠标位置直接控制
        this.inputState.moveX = this.mouse.x * Config.INPUT.MOUSE_SENSITIVITY;
        this.inputState.moveY = this.mouse.y * Config.INPUT.MOUSE_SENSITIVITY;
        
        // 应用死区
        if (Math.abs(this.inputState.moveX) < Config.INPUT.DEADZONE) {
            this.inputState.moveX = 0;
        }
        if (Math.abs(this.inputState.moveY) < Config.INPUT.DEADZONE) {
            this.inputState.moveY = 0;
        }
    }

    /**
     * 处理键盘按下
     */
    handleKeyDown(code) {
        switch (code) {
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = true;
                break;
        }
        
        this.inputState.isActive = true;
    }

    /**
     * 处理键盘释放
     */
    handleKeyUp(code) {
        switch (code) {
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = false;
                break;
        }
        
        // 检查是否还有按键按下
        const hasActiveKeys = Object.values(this.keys).some(key => key);
        if (!hasActiveKeys) {
            this.inputState.isActive = false;
        }
    }

    /**
     * 从键盘输入更新移动状态
     */
    updateInputFromKeyboard() {
        let moveX = 0;
        let moveY = 0;
        
        if (this.keys.left) moveX -= 1;
        if (this.keys.right) moveX += 1;
        if (this.keys.up) moveY += 1;
        if (this.keys.down) moveY -= 1;
        
        // 标准化对角线移动
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }
        
        this.inputState.moveX = moveX * Config.INPUT.KEYBOARD_SPEED;
        this.inputState.moveY = moveY * Config.INPUT.KEYBOARD_SPEED;
    }

    /**
     * 从触摸输入更新移动状态
     */
    updateInputFromTouch() {
        if (!this.canvasElement) return;
        
        const rect = this.canvasElement.getBoundingClientRect();
        
        // 计算触摸相对于初始位置的偏移
        const deltaX = this.touch.x - this.touch.startX;
        const deltaY = this.touch.y - this.touch.startY;
        
        // 标准化到屏幕比例
        const normalizedX = (deltaX / rect.width) * 2;
        const normalizedY = -(deltaY / rect.height) * 2;
        
        this.inputState.moveX = normalizedX * Config.INPUT.TOUCH_SENSITIVITY;
        this.inputState.moveY = normalizedY * Config.INPUT.TOUCH_SENSITIVITY;
        
        // 限制范围
        this.inputState.moveX = Math.max(-1, Math.min(1, this.inputState.moveX));
        this.inputState.moveY = Math.max(-1, Math.min(1, this.inputState.moveY));
    }

    /**
     * 更新输入系统（每帧调用）
     */
    update(deltaTime) {
        // 输入平滑处理
        this.smoothInput(deltaTime);
        
        // 如果没有活动输入，逐渐减少到0
        if (!this.inputState.isActive) {
            this.inputState.moveX *= 0.9;
            this.inputState.moveY *= 0.9;
            
            // 接近0时直接设为0
            if (Math.abs(this.inputState.moveX) < 0.01) this.inputState.moveX = 0;
            if (Math.abs(this.inputState.moveY) < 0.01) this.inputState.moveY = 0;
        }
    }

    /**
     * 输入平滑处理
     */
    smoothInput(deltaTime) {
        const smoothFactor = Config.INPUT.SMOOTH_FACTOR;
        
        this.smoothedInput.x += (this.inputState.moveX - this.smoothedInput.x) * smoothFactor;
        this.smoothedInput.y += (this.inputState.moveY - this.smoothedInput.y) * smoothFactor;
    }

    /**
     * 获取当前输入状态
     */
    getInputState() {
        const state = {
            moveX: this.smoothedInput.x,
            moveY: this.smoothedInput.y,
            isActive: this.inputState.isActive
        };
        
        // 调试输出：当有输入时显示状态
        if (state.isActive && (Math.abs(state.moveX) > 0.01 || Math.abs(state.moveY) > 0.01)) {
            console.log('输入状态:', {
                moveX: state.moveX.toFixed(3),
                moveY: state.moveY.toFixed(3),
                raw: {
                    moveX: this.inputState.moveX.toFixed(3),
                    moveY: this.inputState.moveY.toFixed(3)
                },
                mouse: { x: this.mouse.x.toFixed(3), y: this.mouse.y.toFixed(3) },
                keys: Object.keys(this.keys).filter(key => this.keys[key])
            });
        }
        
        return state;
    }

    /**
     * 获取原始输入状态（未平滑）
     */
    getRawInputState() {
        return { ...this.inputState };
    }

    /**
     * 重置输入状态
     */
    resetInput() {
        this.inputState.moveX = 0;
        this.inputState.moveY = 0;
        this.inputState.isActive = false;
    }

    /**
     * 重置键盘状态
     */
    resetKeyboard() {
        this.keys.left = false;
        this.keys.right = false;
        this.keys.up = false;
        this.keys.down = false;
        this.updateInputFromKeyboard();
    }

    /**
     * 设置输入灵敏度
     */
    setSensitivity(type, value) {
        switch (type) {
            case 'mouse':
                Config.INPUT.MOUSE_SENSITIVITY = value;
                break;
            case 'touch':
                Config.INPUT.TOUCH_SENSITIVITY = value;
                break;
            case 'keyboard':
                Config.INPUT.KEYBOARD_SPEED = value;
                break;
        }
        console.log(`${type}灵敏度已设置为: ${value}`);
    }

    /**
     * 获取设备信息
     */
    getDeviceInfo() {
        return { ...this.deviceInfo };
    }

    /**
     * 启用/禁用输入类型
     */
    setInputEnabled(type, enabled) {
        switch (type) {
            case 'mouse':
                this.deviceInfo.hasMouse = enabled;
                break;
            case 'touch':
                this.deviceInfo.hasTouch = enabled;
                break;
            case 'keyboard':
                // 键盘始终启用，这里可以添加逻辑
                break;
        }
        
        if (!enabled) {
            this.resetInput();
        }
        
        console.log(`${type}输入已${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 获取输入统计信息
     */
    getInputStats() {
        return {
            currentInput: this.getInputState(),
            deviceInfo: this.deviceInfo,
            mousePosition: { x: this.mouse.x, y: this.mouse.y },
            activeKeys: Object.keys(this.keys).filter(key => this.keys[key]),
            touchActive: this.touch.isActive,
            canvasElement: this.canvasElement ? this.canvasElement.tagName : 'none'
        };
    }

    /**
     * 销毁输入管理器
     */
    dispose() {
        // 移除所有事件监听器
        const canvas = document.querySelector('canvas') || document.body;
        
        // 这里应该保存事件监听器的引用以便正确移除
        // 简化起见，我们重新加载页面时会自动清理
        
        this.resetInput();
        this.resetKeyboard();
        
        console.log('输入管理器已销毁');
    }

    /**
     * 设置Canvas元素（外部调用）
     */
    setCanvasElement(canvas) {
        if (canvas && (canvas.tagName === 'CANVAS' || canvas.tagName === 'DIV')) {
            this.canvasElement = canvas;
            console.log('Canvas元素已更新:', canvas.tagName);
            
            // 立即重新绑定事件（不等待延迟初始化）
            this.setupMouseInput();
            this.setupTouchInput();
            this.setupPointerLock();
            
            console.log('输入事件已立即重新绑定');
        }
    }

    /**
     * 重新绑定事件监听器
     */
    rebindEvents() {
        // 清理旧的事件监听器（简化处理，实际项目中应该保存引用）
        console.log('重新绑定输入事件...');
        
        this.setupMouseInput();
        this.setupTouchInput();
        this.setupPointerLock();
    }
} 