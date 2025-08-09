import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const ThreeScene = (): React.ReactElement => {
  // React Refを使ってDOM要素とThree.jsオブジェクトを参照
  const mountRef = useRef<HTMLDivElement>(null); // Three.jsキャンバスをマウントするDOM要素への参照
  const sceneRef = useRef<THREE.Scene | null>(null); // Three.jsシーンオブジェクトへの参照
  const cubeRef = useRef<THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial> | null>(null); // キューブメッシュへの参照
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null); // カメラへの参照（スクロールで操作するため）

  useEffect(() => {
    // === Three.js基本セットアップ ===
    
    // 1. シーン（Scene）: 3Dオブジェクトを配置する空間
    const scene = new THREE.Scene();
    
    // 2. カメラ（Camera）: シーンを見る視点を定義
    // PerspectiveCamera(視野角, アスペクト比, 近クリッピング面, 遠クリッピング面)
    const camera = new THREE.PerspectiveCamera(
      75, // 視野角（度）- 広角ほど広い範囲が見える
      window.innerWidth / window.innerHeight, // アスペクト比（幅/高さ）
      0.1, // 近クリッピング面 - これより近いオブジェクトは描画されない
      1000 // 遠クリッピング面 - これより遠いオブジェクトは描画されない
    );
    
    // 3. レンダラー（Renderer）: シーンとカメラから画像を生成
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, // アンチエイリアシング（ギザギザを滑らかに）
      alpha: false, // 透明度無効
      premultipliedAlpha: false
    });
    
    // レンダラーの設定
    renderer.setSize(window.innerWidth, window.innerHeight); // 描画サイズをウィンドウサイズに設定
    renderer.setPixelRatio(window.devicePixelRatio); // デバイスのピクセル比を設定
    renderer.setClearColor(0x0a0a0a, 1.0); // 背景色を設定（ダークグレー、完全不透明）
    renderer.outputColorSpace = THREE.SRGBColorSpace; // 色空間を設定
    
    // キャンバスに強制的にスタイルを適用
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';
    
    console.log('Canvas created:', canvas); // デバッグ用
    console.log('Canvas size:', canvas.width, 'x', canvas.height); // デバッグ用
    
    mountRef.current!.appendChild(canvas); // HTML CanvasをDOMに追加

    // === 3Dオブジェクト（キューブ）の作成 ===
    
    // ジオメトリ（Geometry）: オブジェクトの形状を定義
    const geometry = new THREE.BoxGeometry(1, 3, 1); // 2x2x2のボックス形状
    
    // マテリアル（Material）: オブジェクトの見た目（色、質感）を定義
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x16213e, // ベースカラー（濃い青）
      shininess: 50, // 光沢の強さ（0-1000）
      specular: 0x4dabf7 // ハイライト色（明るい青）
    });
    
    // メッシュ（Mesh）: ジオメトリとマテリアルを組み合わせた3Dオブジェクト
    const cube = new THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial>(geometry, material);
    
    // 初期回転を設定（見栄えの良い角度に）
    cube.rotation.x = Math.PI * 0.2; // 36度回転
    cube.rotation.y = Math.PI * 0.25; // 45度回転
    cube.rotation.z = Math.PI * 0.1; // 18度回転
    
    scene.add(cube); // シーンにキューブを追加

    // === ライティング（照明）の設定 ===
    
    // 環境光（AmbientLight）: 全体を均一に照らす光（影を作らない）
    const ambientLight = new THREE.AmbientLight(
      0x404040, // 光の色（グレー）
      1 // 光の強さ（0-1）
    );
    scene.add(ambientLight);

    // 平行光源（DirectionalLight）: 太陽光のような方向性のある光
    const directionalLight = new THREE.DirectionalLight(
      0x4dabf7, // 光の色（青）
      1 // 光の強さ
    );
    directionalLight.position.set(5, 5, 5); // 光の位置（x, y, z）
    scene.add(directionalLight);

    // カメラの位置設定（Z軸正の方向に5単位移動）
    camera.position.set(0, 0, 5); // より明示的に設定
    camera.lookAt(0, 0, 0); // 原点を見るように設定

    // React Refに参照を保存（他の関数から使用するため）
    sceneRef.current = scene;
    cubeRef.current = cube;
    cameraRef.current = camera;
    
    // デバッグ: シーンの初期状態をログ出力
    console.log('Scene created with', scene.children.length, 'children');
    console.log('Camera position:', camera.position);
    console.log('Cube position:', cube.position);
    console.log('Cube visible:', cube.visible);
    console.log('Material color:', cube.material.color);

    // === 初期状態設定 ===
    // キューブは静止状態から開始（スクロールによってのみアニメーション）

    // === スクロール連動アニメーションループ ===
    
    // アニメーションループ（毎フレーム実行される関数）
    const animate = () => {
      requestAnimationFrame(animate); // ブラウザの次の描画タイミングで再帰呼び出し
      
      // スクロール位置に基づいてオブジェクトを更新
      updateFromScroll();
      
      renderer.render(scene, camera); // シーンをレンダリング
    };
    
    // スクロール位置に基づいてオブジェクトを更新する関数
    const updateFromScroll = () => {
      if (cubeRef.current && cameraRef.current) {
        // 現在のスクロール位置を取得
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
        
        // === キューブの回転（初期回転 + スクロール位置に基づく追加回転） ===
        const baseRotationX = Math.PI * 0.2; // 初期回転X（36度）
        const baseRotationY = Math.PI * 0.25; // 初期回転Y（45度）
        const baseRotationZ = Math.PI * 0.1; // 初期回転Z（18度）
        
        cubeRef.current.rotation.x = baseRotationX + scrollProgress * Math.PI * 4; // 初期 + 2回転
        cubeRef.current.rotation.y = baseRotationY + scrollProgress * Math.PI * 3; // 初期 + 1.5回転
        cubeRef.current.rotation.z = baseRotationZ + scrollProgress * Math.PI * 2; // 初期 + 1回転
        
        // === カメラのズーム（スクロール位置に基づく） ===
        const minZ = 3; // 最小距離（ズームイン）
        const maxZ = 12; // 最大距離（ズームアウト）
        cameraRef.current.position.z = minZ + scrollProgress * (maxZ - minZ);
        
        // === キューブの位置変化（スクロール位置に基づく） ===
        cubeRef.current.position.x = Math.sin(scrollProgress * Math.PI * 2) * 1;
        cubeRef.current.position.y = Math.cos(scrollProgress * Math.PI * 3) * 0.5;
        
        // === 色の変化（スクロール位置に基づく） ===
        const hue = scrollProgress; // 0-1の範囲で色相変化
        cubeRef.current.material.color.setHSL(hue, 0.8, 0.6);
        
        // === スケールの変化（スクロール位置に基づく） ===
        const scale = 1 + Math.sin(scrollProgress * Math.PI * 2) * 0.3;
        cubeRef.current.scale.set(scale, scale, scale);
      }
    };
    
    animate(); // アニメーションループを開始

    // === ウィンドウリサイズ対応 ===
    
    const handleResize = () => {
      // ウィンドウサイズが変わった時の処理
      camera.aspect = window.innerWidth / window.innerHeight; // アスペクト比を更新
      camera.updateProjectionMatrix(); // カメラの投影行列を更新
      renderer.setSize(window.innerWidth, window.innerHeight); // レンダラーサイズを更新
    };

    window.addEventListener('resize', handleResize); // リサイズイベントリスナーを追加

    // === クリーンアップ関数（コンポーネントがアンマウントされる時に実行） ===
    return () => {
      window.removeEventListener('resize', handleResize); // リサイズイベントリスナーを削除
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement); // DOMからCanvasを削除
      }
      renderer.dispose(); // レンダラーのメモリリークを防止
    };
  }, []); // 空の依存配列 = コンポーネントマウント時に一度だけ実行


  // JSX: クリック可能なコンテナを返す
  return (
    <div 
      ref={mountRef} // Three.jsキャンバスをマウントするDOM要素
      className="w-screen h-screen overflow-hidden cursor-pointer" // Tailwind CSSクラス
    />
  );
};

export default ThreeScene;