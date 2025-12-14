declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState } from "react";
/**
 * GPU Acceleration Engine
 * WebGL rendering, GPU-powered animations, hardware acceleration optimization, parallel processing
 */

export interface GPUAccelerationConfig {
  // WebGL rendering
  webglRendering: {
    enabled: boolean;
    contextType: "webgl" | "webgl2";
    antialias: boolean;
    powerPreference: "default" | "high-performance" | "low-power";
    failIfMajorPerformanceCaveat: boolean;
    preserveDrawingBuffer: boolean;
    premultipliedAlpha: boolean;
    desynchronized: boolean;
  };

  // GPU-powered animations
  gpuAnimations: {
    enabled: boolean;
    useWebGL: boolean;
    useTransform3d: boolean;
    maxConcurrentAnimations: number;
    frameRate: number;
    quality: "low" | "medium" | "high" | "ultra";
    adaptiveQuality: boolean;
    batteryOptimization: boolean;
  };

  // Hardware acceleration optimization
  hardwareAcceleration: {
    enabled: boolean;
    forceAcceleration: boolean;
    detectCapabilities: boolean;
    optimizeForDevice: boolean;
    memoryManagement: boolean;
    textureOptimization: boolean;
    shaderOptimization: boolean;
  };

  // Parallel processing
  parallelProcessing: {
    enabled: boolean;
    useWebWorkers: boolean;
    useOffscreenCanvas: boolean;
    maxWorkers: number;
    workerPoolSize: number;
    taskDistribution: "round-robin" | "load-balanced" | "priority-based";
    sharedArrayBuffer: boolean;
  };

  // Performance monitoring
  performanceMonitoring: {
    enabled: boolean;
    trackFrameTime: boolean;
    trackMemoryUsage: boolean;
    trackGPUUtilization: boolean;
    trackDrawCalls: boolean;
    trackTextureMemory: boolean;
    realTimeMetrics: boolean;
  };
}

export interface GPUCapabilities {
  webglSupported: boolean;
  webgl2Supported: boolean;
  maxTextureSize: number;
  maxVertexAttributes: number;
  maxVertexUniformVectors: number;
  maxFragmentUniformVectors: number;
  maxVaryingVectors: number;
  maxDrawBuffers: number;
  vendor: string;
  renderer: string;
  version: string;
  shadingLanguageVersion: string;
  extensions: string[];
  maxViewportDims: number[];
  maxRenderBufferSize: number;
  aliasedLineWidthRange: number[];
  aliasedPointSizeRange: number[];
  maxTextureImageUnits: number;
  maxRenderbufferSize: number;
  maxCombinedTextureImageUnits: number;
  maxCubeMapTextureSize: number;
  maxVertexTextureImageUnits: number;
  max3DTextureSize: number;
  maxArrayTextureLayers: number;
}

export interface GPUAnimation {
  id: string;
  type: "transform" | "opacity" | "color" | "texture" | "custom";
  target: HTMLElement | CanvasElement;
  properties: AnimationProperty[];
  duration: number;
  easing: string;
  delay: number;
  iterations: number;
  direction: "normal" | "reverse" | "alternate" | "alternate-reverse";
  fillMode: "none" | "forwards" | "backwards" | "both";
  startTime: number;
  currentTime: number;
  paused: boolean;
  completed: boolean;
  gpuAccelerated: boolean;
  webglProgram?: WebGLProgram;
  shaderUniforms: Record<string, any>;
}

export interface AnimationProperty {
  name: string;
  from: any;
  to: any;
  current: any;
  unit?: string;
  easing?: string;
}

export interface GPUShader {
  id: string;
  name: string;
  type: "vertex" | "fragment" | "compute";
  source: string;
  compiled: boolean;
  program?: WebGLProgram;
  uniforms: Record<string, ShaderUniform>;
  attributes: Record<string, ShaderAttribute>;
}

export interface ShaderUniform {
  name: string;
  type:
    | "float"
    | "vec2"
    | "vec3"
    | "vec4"
    | "mat3"
    | "mat4"
    | "sampler2D"
    | "samplerCube";
  value: any;
  location?: WebGLUniformLocation;
}

export interface ShaderAttribute {
  name: string;
  type: "float" | "vec2" | "vec3" | "vec4";
  buffer?: WebGLBuffer;
  location?: number;
  size: number;
  normalized: boolean;
  stride: number;
  offset: number;
}

export interface GPURenderTarget {
  id: string;
  canvas: HTMLCanvasElement;
  context: WebGLRenderingContext | WebGL2RenderingContext;
  width: number;
  height: number;
  pixelRatio: number;
  viewport: { x: number; y: number; width: number; height: number };
  clearColor: { r: number; g: number; b: number; a: number };
  clearDepth: number;
  clearStencil: number;
}

export interface GPUPerformanceMetrics {
  timestamp: Date;
  frameTime: number;
  frameRate: number;
  drawCalls: number;
  triangles: number;
  vertices: number;
  textureMemory: number;
  bufferMemory: number;
  shaderCount: number;
  gpuUtilization: number;
  memoryUsage: number;
  powerConsumption: number;
  thermalState: "normal" | "warm" | "hot" | "critical";
  adaptiveQuality: string;
  activeAnimations: number;
  droppedFrames: number;
  renderingTime: number;
  compositingTime: number;
}

export interface GPUWorkerTask {
  id: string;
  type: "compute" | "render" | "process" | "optimize";
  priority: number;
  data: any;
  transferables?: Transferable[];
  workerId?: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  completed: boolean;
  result?: any;
  error?: string;
}

export class GPUAccelerationEngine {
  private static instance: GPUAccelerationEngine;
  private config: GPUAccelerationConfig;
  private webglRenderer: WebGLRenderer;
  private animationEngine: GPUAnimationEngine;
  private hardwareOptimizer: HardwareOptimizer;
  private parallelProcessor: ParallelProcessor;
  private performanceMonitor: GPUPerformanceMonitor;
  private capabilities: GPUCapabilities;
  private renderTargets: Map<string, GPURenderTarget> = new Map();
  private shaders: Map<string, GPUShader> = new Map();
  private animations: Map<string, GPUAnimation> = new Map();
  private workerPool: Worker[] = [];
  private activeTasks: Map<string, GPUWorkerTask> = new Map();
  private metrics: GPUPerformanceMetrics;
  private isInitialized: boolean = false;
  private animationFrameId: number | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.webglRenderer = new WebGLRenderer(this.config.webglRendering);
    this.animationEngine = new GPUAnimationEngine(this.config.gpuAnimations);
    this.hardwareOptimizer = new HardwareOptimizer(
      this.config.hardwareAcceleration,
    );
    this.parallelProcessor = new ParallelProcessor(
      this.config.parallelProcessing,
    );
    this.performanceMonitor = new GPUPerformanceMonitor(
      this.config.performanceMonitoring,
    );
    this.capabilities = this.detectGPUCapabilities();
    this.metrics = this.initializeMetrics();
    this.initializeGPUAcceleration();
  }

  static getInstance(): GPUAccelerationEngine {
    if (!GPUAccelerationEngine.instance) {
      GPUAccelerationEngine.instance = new GPUAccelerationEngine();
    }
    return GPUAccelerationEngine.instance;
  }

  private getDefaultConfig(): GPUAccelerationConfig {
    return {
      webglRendering: {
        enabled: true,
        contextType: "webgl2",
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
        premultipliedAlpha: true,
        desynchronized: false,
      },
      gpuAnimations: {
        enabled: true,
        useWebGL: true,
        useTransform3d: true,
        maxConcurrentAnimations: 50,
        frameRate: 60,
        quality: "high",
        adaptiveQuality: true,
        batteryOptimization: true,
      },
      hardwareAcceleration: {
        enabled: true,
        forceAcceleration: false,
        detectCapabilities: true,
        optimizeForDevice: true,
        memoryManagement: true,
        textureOptimization: true,
        shaderOptimization: true,
      },
    };
  }

  private initializeMetrics(): GPUPerformanceMetrics {
    return {
      timestamp: new Date(),
      frameTime: 0,
      frameRate: 60,
      drawCalls: 0,
      triangles: 0,
      vertices: 0,
      textureMemory: 0,
      bufferMemory: 0,
      shaderCount: 0,
      gpuUtilization: 0,
      memoryUsage: 0,
      powerConsumption: 0,
      thermalState: "normal",
      adaptiveQuality: "high",
      activeAnimations: 0,
      droppedFrames: 0,
      renderingTime: 0,
      compositingTime: 0,
    };
  }

  private detectGPUCapabilities(): GPUCapabilities {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

    if (!gl) {
      return this.getFallbackCapabilities();
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

    return {
      webglSupported: !!canvas.getContext("webgl"),
      webgl2Supported: !!canvas.getContext("webgl2"),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      maxFragmentUniformVectors: gl.getParameter(
        gl.MAX_FRAGMENT_UNIFORM_VECTORS,
      ),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
      vendor: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : "Unknown",
      renderer: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "Unknown",
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      extensions: gl.getSupportedExtensions() || [],
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
      aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxCombinedTextureImageUnits: gl.getParameter(
        gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
      ),
      maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      maxVertexTextureImageUnits: gl.getParameter(
        gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
      ),
      max3DTextureSize: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE) || 0,
      maxArrayTextureLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS) || 0,
    };
  }

  private getFallbackCapabilities(): GPUCapabilities {
    return {
      webglSupported: false,
      webgl2Supported: false,
      maxTextureSize: 0,
      maxVertexAttributes: 0,
      maxVertexUniformVectors: 0,
      maxFragmentUniformVectors: 0,
      maxVaryingVectors: 0,
      maxDrawBuffers: 0,
      vendor: "Unknown",
      renderer: "Unknown",
      version: "0.0",
      shadingLanguageVersion: "0.0",
      extensions: [],
      maxViewportDims: [0, 0],
      maxRenderBufferSize: 0,
      aliasedLineWidthRange: [0, 0],
      aliasedPointSizeRange: [0, 0],
      maxTextureImageUnits: 0,
      maxRenderbufferSize: 0,
      maxCombinedTextureImageUnits: 0,
      maxCubeMapTextureSize: 0,
      maxVertexTextureImageUnits: 0,
      max3DTextureSize: 0,
      maxArrayTextureLayers: 0,
    };
  }

  private initializeGPUAcceleration(): void {
    if (typeof window === "undefined") return;

    // Check WebGL support
    if (!this.capabilities.webglSupported) {
      console.warn("WebGL not supported, falling back to CSS animations");
      this.config.webglRendering.enabled = false;
      this.config.gpuAnimations.useWebGL = false;
    }

    // Initialize hardware optimization
    if (this.config.hardwareAcceleration.enabled) {
      this.hardwareOptimizer.optimize();
    }

    // Initialize worker pool
    if (this.config.parallelProcessing.enabled) {
      this.initializeWorkerPool();
    }

    // Set up performance monitoring
    if (this.config.performanceMonitoring.enabled) {
      this.performanceMonitor.startMonitoring();
    }

    // Start render loop
    this.startRenderLoop();

    // Set up event listeners
    this.setupEventListeners();

    this.isInitialized = true;
  }

  private initializeWorkerPool(): void {
    const poolSize = this.config.parallelProcessing.workerPoolSize;

    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(this.createWorkerScript());
      this.workerPool.push(worker);

      worker.addEventListener("message", this.handleWorkerMessage.bind(this));
      worker.addEventListener("error", this.handleWorkerError.bind(this));
    }
  }

  private createWorkerScript(): string {
    return `
      // GPU Worker Script
      self.addEventListener('message', function(e) {
        const task = e.data;
        
        try {
          let result;
          
          switch (task.type) {
            case 'compute':
              result = performComputation(task.data);
              break;
            case 'process':
              result = processData(task.data);
              break;
            case 'optimize':
              result = optimizeData(task.data);
              break;
            default:
              throw new Error('Unknown task type: ' + task.type);
          }
          
          self.postMessage({
            taskId: task.id,
            result: result,
            success: true
          });
          
        } catch (error) {
          self.postMessage({
            taskId: task.id,
            error: error.message,
            success: false
          });
        }
      });
      
      function performComputation(data: any) {
        // Perform GPU-optimized computations
        return { processed: true, data: data };
      }
      
      function processData(data: any) {
        // Process data for GPU rendering
        return { processed: true, data: data };
      }
      
      function optimizeData(data: any) {
        // Optimize data for GPU performance
        return { optimized: true, data: data };
      }
    `;
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { taskId, result, success, error } = event.data;

    const task = this.activeTasks.get(taskId);
    if (task) {
      task.endTime = performance.now();
      task.duration = task.endTime - task.startTime;
      task.completed = true;

      if (success) {
        task.result = result;
      } else {
        task.error = error;
      }

      this.activeTasks.delete(taskId);
    }
  }

  private handleWorkerError(event: ErrorEvent): void {
    console.error("Worker error:", event.error);
  }

  private setupEventListeners(): void {
    // Monitor visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    });

    // Monitor battery level if available
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener("levelchange", () => {
          this.handleBatteryChange(battery.level);
        });

        battery.addEventListener("chargingchange", () => {
          this.handleChargingChange(battery.charging);
        });
      });
    }

    // Monitor thermal state if available
    if ("thermal" in navigator) {
      (navigator as any).thermal.addEventListener(
        "temperaturechange",
        (event: any) => {
          this.handleThermalChange(event.temperature);
        },
      );
    }
  }

  private handleBatteryChange(level: number): void {
    if (this.config.gpuAnimations.batteryOptimization) {
      if (level < 0.2) {
        // Low battery - reduce quality
        this.setAdaptiveQuality("low");
      } else if (level < 0.5) {
        // Medium battery - reduce quality slightly
        this.setAdaptiveQuality("medium");
      } else {
        // High battery - restore quality
        this.setAdaptiveQuality("high");
      }
    }
  }

  private handleChargingChange(charging: boolean): void {
    if (charging && this.config.gpuAnimations.batteryOptimization) {
      // Device is charging - restore high quality
      this.setAdaptiveQuality("high");
    }
  }

  private handleThermalChange(temperature: number): void {
    let thermalState: "normal" | "warm" | "hot" | "critical";

    if (temperature < 40) {
      thermalState = "normal";
    } else if (temperature < 60) {
      thermalState = "warm";
    } else if (temperature < 80) {
      thermalState = "hot";
    } else {
      thermalState = "critical";
    }

    this.metrics.thermalState = thermalState;

    // Adjust quality based on thermal state
    if (thermalState === "critical") {
      this.setAdaptiveQuality("low");
    } else if (thermalState === "hot") {
      this.setAdaptiveQuality("medium");
    } else if (thermalState === "warm") {
      this.setAdaptiveQuality("high");
    }
  }

  private setAdaptiveQuality(
    quality: "low" | "medium" | "high" | "ultra",
  ): void {
    this.metrics.adaptiveQuality = quality;

    // Adjust rendering parameters based on quality
    switch (quality) {
      case "low":
        this.config.gpuAnimations.frameRate = 30;
        this.config.webglRendering.antialias = false;
        break;
      case "medium":
        this.config.gpuAnimations.frameRate = 45;
        this.config.webglRendering.antialias = true;
        break;
      case "high":
        this.config.gpuAnimations.frameRate = 60;
        this.config.webglRendering.antialias = true;
        break;
      case "ultra":
        this.config.gpuAnimations.frameRate = 120;
        this.config.webglRendering.antialias = true;
        break;
    }
  }

  private startRenderLoop(): void {
    let lastTime = 0;
    const targetFrameTime = 1000 / this.config.gpuAnimations.frameRate;

    const render = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= targetFrameTime) {
        this.render(deltaTime);
        lastTime = currentTime;
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private render(deltaTime: number): void {
    const startTime = performance.now();

    // Update performance metrics
    this.metrics.frameTime = deltaTime;
    this.metrics.frameRate = 1000 / deltaTime;

    // Update animations
    this.animationEngine.update(deltaTime);

    // Render WebGL content
    if (this.config.webglRendering.enabled) {
      this.webglRenderer.render(deltaTime);
    }

    // Process parallel tasks
    this.parallelProcessor.process();

    // Update performance metrics
    const renderTime = performance.now() - startTime;
    this.metrics.renderingTime = renderTime;
    this.metrics.activeAnimations = this.animations.size;

    // Check for dropped frames
    if (deltaTime > targetFrameTime * 1.5) {
      this.metrics.droppedFrames++;
    }
  }

  // Public API: WebGL rendering methods
  public createRenderTarget(
    canvas: HTMLCanvasElement,
    options: RenderTargetOptions = {},
  ): GPURenderTarget {
    const contextOptions: WebGLContextAttributes = {
      alpha: options.alpha !== false,
      antialias: this.config.webglRendering.antialias,
      depth: options.depth !== false,
      failIfMajorPerformanceCaveat:
        this.config.webglRendering.failIfMajorPerformanceCaveat,
      premultipliedAlpha: this.config.webglRendering.premultipliedAlpha,
      preserveDrawingBuffer: this.config.webglRendering.preserveDrawingBuffer,
      stencil: options.stencil || false,
      desynchronized: this.config.webglRendering.desynchronized,
    };

    const context = canvas.getContext(
      this.config.webglRendering.contextType,
      contextOptions,
    );

    if (!context) {
      throw new Error("Failed to create WebGL context");
    }

    const pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;
    const width = options.width || canvas.width;
    const height = options.height || canvas.height;

    // Set canvas size
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const renderTarget: GPURenderTarget = {
      id: this.generateRenderTargetId(),
      canvas,
      context,
      width,
      height,
      pixelRatio,
      viewport: { x: 0, y: 0, width, height },
      clearColor: options.clearColor || { r: 0, g: 0, b: 0, a: 0 },
      clearDepth: options.clearDepth || 1.0,
      clearStencil: options.clearStencil || 0,
    };

    this.renderTargets.set(renderTarget.id, renderTarget);

    return renderTarget;
  }

  private generateRenderTargetId(): string {
    return `rt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public createShader(
    vertexSource: string,
    fragmentSource: string,
    options: ShaderOptions = {},
  ): GPUShader {
    const shader: GPUShader = {
      id: this.generateShaderId(),
      name: options.name || "unnamed",
      type: "vertex", // Will be updated based on source
      source: "",
      compiled: false,
      uniforms: {},
      attributes: {},
    };

    // Create vertex shader
    const vertexShader = this.compileShader(vertexSource, "vertex");
    if (!vertexShader) {
      throw new Error("Failed to compile vertex shader");
    }

    // Create fragment shader
    const fragmentShader = this.compileShader(fragmentSource, "fragment");
    if (!fragmentShader) {
      throw new Error("Failed to compile fragment shader");
    }

    // Create program
    const program = this.linkProgram(vertexShader, fragmentShader);
    if (!program) {
      throw new Error("Failed to link shader program");
    }

    shader.program = program;
    shader.compiled = true;

    // Extract uniforms and attributes
    this.extractShaderUniforms(shader);
    this.extractShaderAttributes(shader);

    this.shaders.set(shader.id, shader);
    this.metrics.shaderCount++;

    return shader;
  }

  private generateShaderId(): string {
    return `shader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private compileShader(
    source: string,
    type: "vertex" | "fragment",
  ): WebGLShader | null {
    const gl = this.getWebGLContext();
    if (!gl) return null;

    const shader = gl.createShader(
      type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER,
    );

    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      console.error("Shader compilation error:", error);
      return null;
    }

    return shader;
  }

  private linkProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ): WebGLProgram | null {
    const gl = this.getWebGLContext();
    if (!gl) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      console.error("Program linking error:", error);
      return null;
    }

    return program;
  }

  private extractShaderUniforms(shader: GPUShader): void {
    const gl = this.getWebGLContext();
    if (!gl || !shader.program) return;

    const uniformCount = gl.getProgramParameter(
      shader.program,
      gl.ACTIVE_UNIFORMS,
    );

    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(shader.program, i);
      if (!info) continue;

      const location = gl.getUniformLocation(shader.program, info.name);
      if (!location) continue;

      shader.uniforms[info.name] = {
        name: info.name,
        type: this.mapUniformType(info.type),
        value: null,
        location,
      };
    }
  }

  private extractShaderAttributes(shader: GPUShader): void {
    const gl = this.getWebGLContext();
    if (!gl || !shader.program) return;

    const attributeCount = gl.getProgramParameter(
      shader.program,
      gl.ACTIVE_ATTRIBUTES,
    );

    for (let i = 0; i < attributeCount; i++) {
      const info = gl.getActiveAttrib(shader.program, i);
      if (!info) continue;

      const location = gl.getAttribLocation(shader.program, info.name);
      if (location < 0) continue;

      shader.attributes[info.name] = {
        name: info.name,
        type: this.mapAttributeType(info.type),
        location,
        size: info.size,
        normalized: false,
        stride: 0,
        offset: 0,
      };
    }
  }

  private mapUniformType(glType: number): ShaderUniform["type"] {
    const gl = this.getWebGLContext();
    if (!gl) return "float";

    switch (glType) {
      case gl.FLOAT:
        return "float";
      case gl.FLOAT_VEC2:
        return "vec2";
      case gl.FLOAT_VEC3:
        return "vec3";
      case gl.FLOAT_VEC4:
        return "vec4";
      case gl.FLOAT_MAT3:
        return "mat3";
      case gl.FLOAT_MAT4:
        return "mat4";
      case gl.SAMPLER_2D:
        return "sampler2D";
      case gl.SAMPLER_CUBE:
        return "samplerCube";
      default:
        return "float";
    }
  }

  private mapAttributeType(glType: number): ShaderAttribute["type"] {
    const gl = this.getWebGLContext();
    if (!gl) return "float";

    switch (glType) {
      case gl.FLOAT:
        return "float";
      case gl.FLOAT_VEC2:
        return "vec2";
      case gl.FLOAT_VEC3:
        return "vec3";
      case gl.FLOAT_VEC4:
        return "vec4";
      default:
        return "float";
    }
  }

  private getWebGLContext():
    | WebGLRenderingContext
    | WebGL2RenderingContext
    | null {
    // Return the first available WebGL context
    for (const renderTarget of this.renderTargets.values()) {
      return renderTarget.context;
    }
    return null;
  }

  // Public API: Animation methods
  public createAnimation(
    target: HTMLElement | CanvasElement,
    properties: AnimationProperty[],
    options: AnimationOptions = {},
  ): GPUAnimation {
    const animation: GPUAnimation = {
      id: this.generateAnimationId(),
      type: options.type || "transform",
      target,
      properties: properties.map((prop) => ({ ...prop, current: prop.from })),
      duration: options.duration || 1000,
      easing: options.easing || "ease",
      delay: options.delay || 0,
      iterations: options.iterations || 1,
      direction: options.direction || "normal",
      fillMode: options.fillMode || "none",
      startTime: performance.now() + options.delay,
      currentTime: 0,
      paused: false,
      completed: false,
      gpuAccelerated:
        this.config.gpuAnimations.useWebGL && this.capabilities.webglSupported,
      shaderUniforms: {},
    };

    // Create WebGL program if needed
    if (animation.gpuAccelerated) {
      animation.webglProgram = this.createAnimationShader(animation);
    }

    this.animations.set(animation.id, animation);

    return animation;
  }

  private generateAnimationId(): string {
    return `anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createAnimationShader(
    animation: GPUAnimation,
  ): WebGLProgram | undefined {
    const vertexShaderSource = `
      attribute vec2 a_position;
      uniform mat4 u_transform;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = u_transform * vec4(a_position, 0.0, 1.0);
        v_texCoord = (a_position + 1.0) * 0.5;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_opacity;
      uniform vec4 u_color;
      varying vec2 v_texCoord;
      
      void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        gl_FragColor = texColor * u_opacity * u_color;
      }
    `;

    try {
      const shader = this.createShader(
        vertexShaderSource,
        fragmentShaderSource,
      );
      return shader.program;
    } catch (error) {
      console.error("Failed to create animation shader:", error);
      return undefined;
    }
  }

  public playAnimation(animationId: string): void {
    const animation = this.animations.get(animationId);
    if (animation) {
      animation.startTime = performance.now();
      animation.paused = false;
      animation.completed = false;
    }
  }

  public pauseAnimation(animationId: string): void {
    const animation = this.animations.get(animationId);
    if (animation) {
      animation.paused = true;
    }
  }

  public stopAnimation(animationId: string): void {
    const animation = this.animations.get(animationId);
    if (animation) {
      animation.paused = true;
      animation.completed = true;

      // Reset to initial state
      animation.properties.forEach((prop) => {
        prop.current = prop.from;
      });
    }
  }

  private pauseAnimations(): void {
    this.animations.forEach((animation) => {
      animation.paused = true;
    });
  }

  private resumeAnimations(): void {
    this.animations.forEach((animation) => {
      if (!animation.completed) {
        animation.paused = false;
      }
    });
  }

  // Public API: Parallel processing methods
  public executeTask(
    task: Omit<
      GPUWorkerTask,
      | "id"
      | "startTime"
      | "endTime"
      | "duration"
      | "completed"
      | "result"
      | "error"
    >,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const gpuTask: GPUWorkerTask = {
        id: this.generateTaskId(),
        ...task,
        startTime: performance.now(),
        endTime: undefined,
        duration: undefined,
        completed: false,
        result: undefined,
        error: undefined,
      };

      // Find available worker
      const worker = this.getAvailableWorker();
      if (!worker) {
        // Queue task if no worker available
        setTimeout(() => this.executeTask(task), 100);
        return;
      }

      // Assign worker
      gpuTask.workerId = this.workerPool.indexOf(worker);
      this.activeTasks.set(gpuTask.id, gpuTask);

      // Send task to worker
      const message = {
        id: gpuTask.id,
        type: gpuTask.type,
        priority: gpuTask.priority,
        data: gpuTask.data,
      };

      const transferables = gpuTask.transferables || [];
      worker.postMessage(message, transferables);

      // Set up completion handler
      const checkCompletion = () => {
        const completedTask = this.activeTasks.get(gpuTask.id);
        if (completedTask && completedTask.completed) {
          if (completedTask.result) {
            resolve(completedTask.result);
          } else if (completedTask.error) {
            reject(new Error(completedTask.error));
          }
        } else {
          setTimeout(checkCompletion, 10);
        }
      };

      checkCompletion();
    });
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAvailableWorker(): Worker | null {
    // Find worker with least active tasks
    let availableWorker: Worker | null = null;
    let minTasks = Infinity;

    this.workerPool.forEach((worker) => {
      const activeTasks = Array.from(this.activeTasks.values()).filter(
        (task) => task.workerId === this.workerPool.indexOf(worker),
      ).length;

      if (activeTasks < minTasks) {
        minTasks = activeTasks;
        availableWorker = worker;
      }
    });

    return availableWorker;
  }

  // Public API: Performance and monitoring methods
  public getPerformanceMetrics(): GPUPerformanceMetrics {
    return { ...this.metrics };
  }

  public getGPUCapabilities(): GPUCapabilities {
    return { ...this.capabilities };
  }

  public getActiveAnimations(): GPUAnimation[] {
    return Array.from(this.animations.values());
  }

  public getActiveTasks(): GPUWorkerTask[] {
    return Array.from(this.activeTasks.values());
  }

  public optimizePerformance(): void {
    // Analyze current performance and optimize
    this.hardwareOptimizer.optimize();
    this.animationEngine.optimize();
    this.webglRenderer.optimize();
  }

  public updateConfig(newConfig: Partial<GPUAccelerationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update sub-systems
    this.webglRenderer.updateConfig(this.config.webglRendering);
    this.animationEngine.updateConfig(this.config.gpuAnimations);
    this.hardwareOptimizer.updateConfig(this.config.hardwareAcceleration);
    this.parallelProcessor.updateConfig(this.config.parallelProcessing);
    this.performanceMonitor.updateConfig(this.config.performanceMonitoring);
  }

  public generatePerformanceReport(): string {
    const metrics = this.getPerformanceMetrics();
    const capabilities = this.getGPUCapabilities();
    const animations = this.getActiveAnimations();
    const tasks = this.getActiveTasks();

    return `
# GPU Acceleration Performance Report
Generated: ${new Date().toISOString()}

## GPU Capabilities
- WebGL Support: ${capabilities.webglSupported ? "Yes" : "No"}
- WebGL2 Support: ${capabilities.webgl2Supported ? "Yes" : "No"}
- Max Texture Size: ${capabilities.maxTextureSize}px
- Max Vertex Attributes: ${capabilities.maxVertexAttributes}
- Vendor: ${capabilities.vendor}
- Renderer: ${capabilities.renderer}

## Performance Metrics
- Frame Rate: ${metrics.frameRate.toFixed(1)} FPS
- Frame Time: ${metrics.frameTime.toFixed(2)}ms
- Draw Calls: ${metrics.drawCalls}
- Active Animations: ${metrics.activeAnimations}
- Dropped Frames: ${metrics.droppedFrames}
- GPU Utilization: ${(metrics.gpuUtilization * 100).toFixed(1)}%
- Thermal State: ${metrics.thermalState}
- Adaptive Quality: ${metrics.adaptiveQuality}

## Memory Usage
- Texture Memory: ${(metrics.textureMemory / 1024 / 1024).toFixed(2)}MB
- Buffer Memory: ${(metrics.bufferMemory / 1024 / 1024).toFixed(2)}MB
- Total Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB

## Animation Performance
- Total Animations: ${animations.length}
- GPU Accelerated: ${animations.filter((a) => a.gpuAccelerated).length}
- Completed: ${animations.filter((a) => a.completed).length}
- Paused: ${animations.filter((a) => a.paused).length}

## Parallel Processing
- Active Tasks: ${tasks.length}
- Completed Tasks: ${tasks.filter((t) => t.completed).length}
- Failed Tasks: ${tasks.filter((t) => t.error).length}
- Average Task Duration: ${tasks.length > 0 ? (tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / tasks.length).toFixed(2) : 0}ms

## Recommendations
${this.generateGPURecommendations(metrics, capabilities)}
    `;
  }

  private generateGPURecommendations(
    metrics: GPUPerformanceMetrics,
    capabilities: GPUCapabilities,
  ): string {
    const recommendations: string[] = [];

    if (metrics.frameRate < 30) {
      recommendations.push(
        "- Consider reducing animation complexity or quality",
      );
    }

    if (metrics.droppedFrames > 10) {
      recommendations.push(
        "- Optimize rendering pipeline to reduce dropped frames",
      );
    }

    if (metrics.gpuUtilization > 0.8) {
      recommendations.push(
        "- GPU utilization is high, consider reducing workload",
      );
    }

    if (metrics.thermalState === "hot" || metrics.thermalState === "critical") {
      recommendations.push(
        "- Thermal throttling detected, reduce quality settings",
      );
    }

    if (metrics.textureMemory > 100 * 1024 * 1024) {
      // 100MB
      recommendations.push(
        "- High texture memory usage, consider texture optimization",
      );
    }

    if (!capabilities.webgl2Supported) {
      recommendations.push(
        "- Consider upgrading to WebGL2 for better performance",
      );
    }

    return recommendations.length > 0
      ? recommendations.join("\n")
      : "- GPU performance is optimal";
  }

  public destroy(): void {
    // Stop render loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Terminate workers
    this.workerPool.forEach((worker) => {
      worker.terminate();
    });

    // Clear resources
    this.renderTargets.clear();
    this.shaders.clear();
    this.animations.clear();
    this.activeTasks.clear();
    this.workerPool = [];
  }
}

// Supporting interfaces
interface RenderTargetOptions {
  width?: number;
  height?: number;
  pixelRatio?: number;
  alpha?: boolean;
  depth?: boolean;
  stencil?: boolean;
  clearColor?: { r: number; g: number; b: number; a: number };
  clearDepth?: number;
  clearStencil?: number;
}

interface ShaderOptions {
  name?: string;
}

interface AnimationOptions {
  type?: "transform" | "opacity" | "color" | "texture" | "custom";
  duration?: number;
  easing?: string;
  delay?: number;
  iterations?: number;
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  fillMode?: "none" | "forwards" | "backwards" | "both";
}

// Supporting classes (simplified implementations)
class WebGLRenderer {
  constructor(private config: GPUAccelerationConfig["webglRendering"]) {}

  render(deltaTime: number): void {
    // Render WebGL content
  }

  optimize(): void {
    // Optimize WebGL rendering
  }

  updateConfig(config: GPUAccelerationConfig["webglRendering"]): void {
    this.config = config;
  }
}

class GPUAnimationEngine {
  constructor(private config: GPUAccelerationConfig["gpuAnimations"]) {}

  update(deltaTime: number): void {
    // Update GPU animations
  }

  optimize(): void {
    // Optimize animations
  }

  updateConfig(config: GPUAccelerationConfig["gpuAnimations"]): void {
    this.config = config;
  }
}

class HardwareOptimizer {
  constructor(private config: GPUAccelerationConfig["hardwareAcceleration"]) {}

  optimize(): void {
    // Optimize hardware acceleration
  }

  updateConfig(config: GPUAccelerationConfig["hardwareAcceleration"]): void {
    this.config = config;
  }
}

class ParallelProcessor {
  constructor(private config: GPUAccelerationConfig["parallelProcessing"]) {}

  process(): void {
    // Process parallel tasks
  }

  updateConfig(config: GPUAccelerationConfig["parallelProcessing"]): void {
    this.config = config;
  }
}

class GPUPerformanceMonitor {
  constructor(private config: GPUAccelerationConfig["performanceMonitoring"]) {}

  startMonitoring(): void {
    // Start performance monitoring
  }

  updateConfig(config: GPUAccelerationConfig["performanceMonitoring"]): void {
    this.config = config;
  }
}

// React hook
export function useGPUAcceleration() {
  const engine = GPUAccelerationEngine.getInstance();
  const [metrics, setMetrics] = React.useState(engine.getPerformanceMetrics());
  const [capabilities, setCapabilities] = React.useState(
    engine.getGPUCapabilities(),
  );
  const [animations, setAnimations] = React.useState(
    engine.getActiveAnimations(),
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(engine.getPerformanceMetrics());
      setAnimations(engine.getActiveAnimations());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return {
    engine,
    metrics,
    capabilities,
    animations,
    createRenderTarget: engine.createRenderTarget.bind(engine),
    createShader: engine.createShader.bind(engine),
    createAnimation: engine.createAnimation.bind(engine),
    playAnimation: engine.playAnimation.bind(engine),
    pauseAnimation: engine.pauseAnimation.bind(engine),
    stopAnimation: engine.stopAnimation.bind(engine),
    executeTask: engine.executeTask.bind(engine),
    getPerformanceMetrics: engine.getPerformanceMetrics.bind(engine),
    getGPUCapabilities: engine.getGPUCapabilities.bind(engine),
    getActiveAnimations: engine.getActiveAnimations.bind(engine),
    getActiveTasks: engine.getActiveTasks.bind(engine),
    optimizePerformance: engine.optimizePerformance.bind(engine),
    updateConfig: engine.updateConfig.bind(engine),
    generatePerformanceReport: engine.generatePerformanceReport.bind(engine),
    destroy: engine.destroy.bind(engine),
  };
}

export default GPUAccelerationEngine;
