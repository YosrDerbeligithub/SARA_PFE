import { Component, type OnInit, type AfterViewInit, type ElementRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, type FormGroup, Validators } from "@angular/forms";
import * as THREE from "three";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { HttpClient, HttpClientModule } from "@angular/common/http";

// Extended interfaces for custom properties
interface DataPoint extends THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhongMaterial> {
  originalPosition: THREE.Vector3;
  speed: THREE.Vector3;
  pulse: { speed: number; size: number };
  lifetime: { current: number; max: number };
}

interface DataConnection extends THREE.Line<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.LineBasicMaterial> {
  points: { point1: DataPoint; point2: DataPoint };
  dataFlow: { active: boolean; position: number; speed: number; direction: number };
  lifetime: { current: number; max: number };
}

interface PointCloud extends THREE.Points<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.PointsMaterial> {
  speed: number;
  rotationSpeed: THREE.Vector3;
  flowDirection: THREE.Vector3;
}

@Component({
  selector: "app-auth",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,HttpClientModule],
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.css"],
})
export class AuthComponent implements OnInit, AfterViewInit {
  @ViewChild("canvas") private canvasRef!: ElementRef<HTMLCanvasElement>;

  isSignIn = true;
  signInForm!: FormGroup;
  signUpForm!: FormGroup;


 // login credentials
  successMessage: string | null = null;

  email: string = '';
  password: string = '';
  errorMessage: string | null = null;
  


  // Three.js properties

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private dataPoints: DataPoint[] = [];
  private dataConnections: DataConnection[] = [];
  private pointClouds: PointCloud[] = [];
  private grid3D!: THREE.LineSegments;

  private colors = {
    darkBlue: new THREE.Color(0x1a365d),
    blue: new THREE.Color(0x2b6cb0),
    lightBlue: new THREE.Color(0x4299e1),
    purple: new THREE.Color(0x6b46c1),
    lightPurple: new THREE.Color(0x9f7aea),
    white: new THREE.Color(0xffffff),
    teal: new THREE.Color(0x38b2ac),
    indigo: new THREE.Color(0x5a67d8),
    cyan: new THREE.Color(0x0bc5ea),
  };

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    });

    this.signUpForm = this.fb.group(
      {
        username: ["", [Validators.required, Validators.minLength(3)]],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", [Validators.required]],
        role: ["", [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

 // Handle login
 onLogin(): void {
  if (this.signInForm.valid) {
    const { email, password } = this.signInForm.value;
    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);

        // Assuming the role is returned in the response or stored in the session
        const userRole = this.authService.currentUser?.user.role;

        if (userRole === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']); // Navigate to the admin dashboard
        } else {
          this.router.navigate(['/real-time-monitoring']); // Navigate to the historical visualization
        }
      },
      error: (err) => {
        this.errorMessage = err.message;
        console.error('Login failed:', err.message);
      }
    });
  }
}


  onSignUp(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.signUpForm.valid) {
      const { username, email, password, role } = this.signUpForm.value;
      const userData = { username, email, password, role };
      console.log('Sign Up:', userData);

      this.authService.signUp(userData).subscribe({
        next: () => {
          this.successMessage = 'Registration successful! Please sign in.';
          this.signUpForm.reset();
          this.isSignIn = true;
          setTimeout(() => this.successMessage = null, 5000);
        },
        error: (err) => {
          this.errorMessage = err.message;
          setTimeout(() => this.errorMessage = null, 5000);
        }
      });
    }
  }

// Handle logout
onLogout(): void {
  this.authService.logout();
  this.router.navigate(['/auth']); // Navigate back to the login page
}

  dismissSuccess(): void {
    this.successMessage = null;
  }

  dismissError(): void {
    this.errorMessage = null;
  }







  ngAfterViewInit(): void {
    this.initThree();
    this.animate();
  }

  toggleForm(): void {
    this.isSignIn = !this.isSignIn;
    this.errorMessage = null; // Reset error message when toggling forms
  }

  onSignIn(): void {
    if (this.signInForm.valid) {
      console.log("Sign In:", this.signInForm.value);
    }
  }



  passwordMatchValidator(form: FormGroup) {
    const password = form.get("password")?.value;
    const confirmPassword = form.get("confirmPassword")?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private initThree(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f4f8);

    const aspectRatio = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
    this.camera.position.z = 30;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.create3DGrid();
    this.createDataPoints();
    this.createDataConnections();
    this.createEnhancedPointClouds();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 10);
    this.scene.add(directionalLight);
  }

  private create3DGrid(): void {
    const gridSize = 80;
    const gridDivisions = 20;
    const gridStep = gridSize / gridDivisions;
    const gridGeometry = new THREE.BufferGeometry();
    const gridPositions: number[] = [];

    for (let i = -gridSize / 2; i <= gridSize / 2; i += gridStep) {
      gridPositions.push(-gridSize / 2, 0, i, gridSize / 2, 0, i);
      gridPositions.push(i, 0, -gridSize / 2, i, 0, gridSize / 2);
    }

    for (let i = -gridSize / 2; i <= gridSize / 2; i += gridStep * 2) {
      for (let j = -gridSize / 2; j <= gridSize / 2; j += gridStep * 2) {
        gridPositions.push(i, -gridSize / 4, j, i, gridSize / 4, j);
      }
    }

    gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(gridPositions, 3));
    const gridMaterial = new THREE.LineBasicMaterial({
      color: this.colors.darkBlue,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });

    this.grid3D = new THREE.LineSegments(gridGeometry, gridMaterial);
    this.scene.add(this.grid3D);
  }

  private createDataPoints(): void {
    const nodeCount = 150;
    const nodeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const colorOptions = [
      this.colors.blue,
      this.colors.lightBlue,
      this.colors.purple,
      this.colors.lightPurple,
      this.colors.teal,
      this.colors.indigo,
      this.colors.cyan,
    ];

    for (let i = 0; i < nodeCount; i++) {
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      const material = new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        shininess: 30,
      });

      const node = new THREE.Mesh(nodeGeometry, material) as DataPoint;

      const radius = 15 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      node.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      // Initialize custom properties
      node.originalPosition = node.position.clone();
      node.speed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03
      );
      node.pulse = {
        speed: Math.random() * 0.08 + 0.04,
        size: Math.random() * 0.3 + 0.1,
      };
      node.lifetime = {
        current: Math.random() * 100,
        max: 80 + Math.random() * 120,
      };

      this.scene.add(node);
      this.dataPoints.push(node);
    }
  }

  private createDataConnections(): void {
    const connectionCount = 100;

    for (let i = 0; i < connectionCount; i++) {
      let point1Index = Math.floor(Math.random() * this.dataPoints.length);
      let point2Index = Math.floor(Math.random() * this.dataPoints.length);
      while (point2Index === point1Index) point2Index = Math.floor(Math.random() * this.dataPoints.length);

      const point1 = this.dataPoints[point1Index];
      const point2 = this.dataPoints[point2Index];

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array([
            point1.position.x, point1.position.y, point1.position.z,
            point2.position.x, point2.position.y, point2.position.z
          ]),
          3
        )
      );

      const colorKeys = Object.keys(this.colors);
      const randomColor = this.colors[colorKeys[Math.floor(Math.random() * colorKeys.length)] as keyof typeof this.colors];

      const lineMaterial = new THREE.LineBasicMaterial({
        color: randomColor,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.3,
      });

      const line = new THREE.Line(lineGeometry, lineMaterial) as DataConnection;
      line.points = { point1, point2 };
      line.dataFlow = {
        active: Math.random() < 0.4,
        position: 0,
        speed: 0.02 + Math.random() * 0.04,
        direction: Math.random() < 0.5 ? 1 : -1,
      };
      line.lifetime = {
        current: Math.random() * 100,
        max: 100 + Math.random() * 150,
      };

      this.scene.add(line);
      this.dataConnections.push(line);
    }
  }

  private createEnhancedPointClouds(): void {
    const cloudConfigs = [
      { count: 2000, size: 0.12, speed: 0.03, color: this.colors.lightBlue, opacity: 0.7, spread: 70 },
      { count: 1500, size: 0.08, speed: 0.04, color: this.colors.lightPurple, opacity: 0.6, spread: 80 },
      { count: 1000, size: 0.1, speed: 0.05, color: this.colors.teal, opacity: 0.7, spread: 60 },
      { count: 1200, size: 0.07, speed: 0.06, color: this.colors.indigo, opacity: 0.6, spread: 90 },
      { count: 800, size: 0.15, speed: 0.04, color: this.colors.cyan, opacity: 0.7, spread: 75 },
    ];

    cloudConfigs.forEach((config) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(config.count * 3);
      const sizes = new Float32Array(config.count);
      const colors = new Float32Array(config.count * 3);

      for (let i = 0; i < config.count; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * config.spread;
        positions[i3 + 1] = (Math.random() - 0.5) * config.spread;
        positions[i3 + 2] = (Math.random() - 0.5) * config.spread;
        sizes[i] = Math.random() * config.size + config.size * 0.5;

        const colorVariation = 0.2;
        colors[i3] = config.color.r + (Math.random() - 0.5) * colorVariation;
        colors[i3 + 1] = config.color.g + (Math.random() - 0.5) * colorVariation;
        colors[i3 + 2] = config.color.b + (Math.random() - 0.5) * colorVariation;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: config.size,
        vertexColors: true,
        transparent: true,
        opacity: config.opacity,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false,
      });

      const pointCloud = new THREE.Points(geometry, material) as PointCloud;
      pointCloud.speed = config.speed;
      pointCloud.rotationSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.001,
        (Math.random() - 0.5) * 0.001,
        (Math.random() - 0.5) * 0.001
      );
      pointCloud.flowDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      );

      this.scene.add(pointCloud);
      this.pointClouds.push(pointCloud);
    });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Animate data points
    this.dataPoints.forEach((point) => {
      point.position.copy(
        point.originalPosition
          .clone()
          .add(new THREE.Vector3(
            Math.sin(elapsedTime * point.speed.x * 8) * 1.5,
            Math.sin(elapsedTime * point.speed.y * 8) * 1.5,
            Math.sin(elapsedTime * point.speed.z * 8) * 1.5
          ))
      );

      const scale = 1 + Math.sin(elapsedTime * point.pulse.speed) * point.pulse.size;
      point.scale.set(scale, scale, scale);

      point.lifetime.current += delta * 15;
      if (point.lifetime.current > point.lifetime.max) {
        point.lifetime.current = 0;
        point.lifetime.max = 80 + Math.random() * 120;

        const radius = 15 + Math.random() * 15;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        point.originalPosition.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );

        point.material.opacity = 0;
        this.animateOpacity(point.material, 0, 0.8, 0.5);
      }
    });

    // Animate data connections
    this.dataConnections.forEach((connection) => {
      const positions = connection.geometry.attributes["position"].array as Float32Array;
      positions[0] = connection.points.point1.position.x;
      positions[1] = connection.points.point1.position.y;
      positions[2] = connection.points.point1.position.z;
      positions[3] = connection.points.point2.position.x;
      positions[4] = connection.points.point2.position.y;
      positions[5] = connection.points.point2.position.z;
      connection.geometry.attributes["position"].needsUpdate = true;

      if (connection.dataFlow.active) {
        connection.dataFlow.position += connection.dataFlow.speed * delta * 15;
        if (connection.dataFlow.position > 1) {
          connection.dataFlow.position = 0;
          if (Math.random() < 0.5) connection.dataFlow.direction *= -1;
        }

        const pulsePosition = connection.dataFlow.direction > 0
          ? connection.dataFlow.position
          : 1 - connection.dataFlow.position;
        const distanceFromPulse = Math.min(Math.abs(0 - pulsePosition), Math.abs(1 - pulsePosition));

        connection.material.opacity = distanceFromPulse < 0.1
          ? 0.3 + (0.1 - distanceFromPulse) * 5
          : 0.3;
      }

      connection.lifetime.current += delta * 15;
      if (connection.lifetime.current > connection.lifetime.max) {
        connection.lifetime.current = 0;
        connection.lifetime.max = 100 + Math.random() * 150;

        let point1Index = Math.floor(Math.random() * this.dataPoints.length);
        let point2Index = Math.floor(Math.random() * this.dataPoints.length);
        while (point2Index === point1Index) point2Index = Math.floor(Math.random() * this.dataPoints.length);

        connection.points = {
          point1: this.dataPoints[point1Index],
          point2: this.dataPoints[point2Index],
        };

        connection.material.opacity = 0;
        this.animateOpacity(connection.material, 0, 0.3 + Math.random() * 0.3, 0.5);
      }
    });

    // Animate point clouds
    this.pointClouds.forEach((cloud) => {
      cloud.rotation.x += cloud.rotationSpeed.x;
      cloud.rotation.y += cloud.rotationSpeed.y;
      cloud.rotation.z += cloud.rotationSpeed.z;

      const positions = cloud.geometry.attributes["position"].array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const idx = i / 3;
        positions[i] += Math.sin(elapsedTime * cloud.speed * 2 + idx * 0.1) * cloud.speed + cloud.flowDirection.x;
        positions[i + 1] += Math.cos(elapsedTime * cloud.speed * 1.5 + idx * 0.1) * cloud.speed + cloud.flowDirection.y;
        positions[i + 2] += Math.sin(elapsedTime * cloud.speed + idx * 0.1) * cloud.speed + cloud.flowDirection.z;

        const maxDist = 40;
        if (Math.abs(positions[i]) > maxDist) positions[i] *= -0.9;
        if (Math.abs(positions[i + 1]) > maxDist) positions[i + 1] *= -0.9;
        if (Math.abs(positions[i + 2]) > maxDist) positions[i + 2] *= -0.9;
      }
      cloud.geometry.attributes["position"].needsUpdate = true;
    });

    // Animate 3D grid
    this.grid3D.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;
    this.grid3D.rotation.z = Math.cos(elapsedTime * 0.1) * 0.1;

    // Rotate scene
    this.scene.rotation.y += delta * 0.1;
    this.renderer.render(this.scene, this.camera);
  }

  private animateOpacity(material: THREE.Material, from: number, to: number, duration: number): void {
    material.opacity = from;
    const startTime = Date.now();
    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / (duration * 1000), 1);
      material.opacity = from + (to - from) * progress;
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }
}