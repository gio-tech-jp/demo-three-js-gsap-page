import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';

const ThreeScene = (): React.ReactElement => {
  // React Refを使ってDOM要素とThree.jsオブジェクトを参照
  const mountRef = useRef<HTMLDivElement>(null); // Three.jsキャンバスをマウントするDOM要素への参照
  const sceneRef = useRef<THREE.Scene | null>(null); // Three.jsシーンオブジェクトへの参照
  const modelRef = useRef<THREE.Group | null>(null); // GLTFモデル（ギター）への参照
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null); // カメラへの参照（スクロールで操作するため）
  
  // スムーズなアニメーション用のターゲット値を管理
  const targetValues = useRef({
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    cameraZ: 5,
    positionX: 0,
    positionY: 0,
    scale: 1,
    hue: 0
  });

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

    // === GLBモデル（ギター）の読み込み ===
    
    const loader = new GLTFLoader();
    loader.load(
      '/models/guitar.glb',
      (gltf) => {
        const guitarModel = gltf.scene;
        
        // モデルのスケールを大きく調整
        guitarModel.scale.set(5, 5, 5);
        
        // 初期回転をランダムに設定
        guitarModel.rotation.x = Math.random() * Math.PI * 2;
        guitarModel.rotation.y = Math.random() * Math.PI * 2;
        guitarModel.rotation.z = Math.random() * Math.PI * 2;
        
        // 初期位置をランダムに設定
        guitarModel.position.x = (Math.random() - 0.5) * 4;
        guitarModel.position.y = (Math.random() - 0.5) * 4;
        guitarModel.position.z = (Math.random() - 0.5) * 2;
        
        // マテリアルを発色の良い色に変更
        const vibrantColors = [
          0xff0080, // ビビッドピンク
          0x00ff80, // ネオングリーン
          0x8000ff, // エレクトリックパープル
          0xff8000, // ビビッドオレンジ
          0x0080ff, // エレクトリックブルー
          0xff0040, // ホットピンク
          0x40ff00, // ライムグリーン
          0x00ffff, // シアン
          0xffff00, // イエロー
          0xff4000  // レッドオレンジ
        ];
        
        const randomColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
        
        // モデル内の全てのメッシュに新しいマテリアルを適用
        guitarModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhongMaterial({
              color: randomColor,
              shininess: 100,
              specular: 0xffffff,
              emissive: randomColor,
              emissiveIntensity: 0.1
            });
          }
        });
        
        scene.add(guitarModel);
        modelRef.current = guitarModel;
        
        console.log('Guitar model loaded successfully');
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading guitar model:', error);
      }
    );

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

    // カメラの位置設定（より近くに配置してズーム効果）
    camera.position.set(0, 0, 1.8); // カメラをより近くに配置
    camera.lookAt(0, 0, 0); // 原点を見るように設定

    // React Refに参照を保存（他の関数から使用するため）
    sceneRef.current = scene;
    cameraRef.current = camera;
    
    // デバッグ: シーンの初期状態をログ出力
    console.log('Scene created with', scene.children.length, 'children');
    console.log('Camera position:', camera.position);

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
      if (modelRef.current && cameraRef.current) {
        // 現在のスクロール位置を取得
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
        
        // === 初期回転値を保存（初回のみ） ===
        if (!modelRef.current.userData.initialRotationX) {
          modelRef.current.userData.initialRotationX = modelRef.current.rotation.x;
          modelRef.current.userData.initialRotationY = modelRef.current.rotation.y;
          modelRef.current.userData.initialRotationZ = modelRef.current.rotation.z;
          
          // 初期カメラ位置も保存
          modelRef.current.userData.initialCameraZ = cameraRef.current.position.z;
        }
        
        const initialRotationX = modelRef.current.userData.initialRotationX;
        const initialRotationY = modelRef.current.userData.initialRotationY;
        const initialRotationZ = modelRef.current.userData.initialRotationZ;
        
        // === ターゲット値を計算（より緩やかな変化） ===
        targetValues.current.rotationX = initialRotationX + scrollProgress * Math.PI * 2; // 2回転→1回転に削減
        targetValues.current.rotationY = initialRotationY + scrollProgress * Math.PI * 1.5; // 1.5回転→0.75回転に削減
        targetValues.current.rotationZ = initialRotationZ + scrollProgress * Math.PI * 1; // 1回転→0.5回転に削減
        
        // カメラズーム（より近く、ダイナミックに）
        const minZ = 2; // 最小距離（大きくズームイン）
        const maxZ = 6; // 最大距離（適度にズームアウト）
        targetValues.current.cameraZ = minZ + scrollProgress * (maxZ - minZ);
        
        // 位置変化（ギターサイズに合わせて調整）
        targetValues.current.positionX = Math.sin(scrollProgress * Math.PI * 1.5) * 0.8; // 振幅を大きく
        targetValues.current.positionY = Math.cos(scrollProgress * Math.PI * 2) * 0.6; // 振幅を大きく
        
        // 色相変化
        targetValues.current.hue = scrollProgress * 0.8; // 色相変化を少し抑制
        
        // スケール変化（大きいモデルに合わせて調整）
        targetValues.current.scale = 5 + Math.sin(scrollProgress * Math.PI * 1.5) * 1.5; // ベーススケール5に動的変化を追加
        
        // === GSAPを使ったスムーズな補間アニメーション ===
        const duration = 0.8; // アニメーション時間を長くしてよりスムーズに
        const ease = "power2.out"; // イージング関数で自然な動き
        
        // 回転のアニメーション
        gsap.to(modelRef.current.rotation, {
          x: targetValues.current.rotationX,
          y: targetValues.current.rotationY,
          z: targetValues.current.rotationZ,
          duration: duration,
          ease: ease
        });
        
        // カメラのアニメーション
        gsap.to(cameraRef.current.position, {
          z: targetValues.current.cameraZ,
          duration: duration,
          ease: ease
        });
        
        // 位置のアニメーション
        gsap.to(modelRef.current.position, {
          x: targetValues.current.positionX,
          y: targetValues.current.positionY,
          duration: duration,
          ease: ease
        });
        
        // スケールのアニメーション
        gsap.to(modelRef.current.scale, {
          x: targetValues.current.scale,
          y: targetValues.current.scale,
          z: targetValues.current.scale,
          duration: duration,
          ease: ease
        });
        
        // 色のアニメーション（モデル内の全メッシュに適用）
        gsap.to({ hue: targetValues.current.hue }, {
          hue: targetValues.current.hue,
          duration: duration,
          ease: ease,
          onUpdate: function() {
            modelRef.current?.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
                child.material.color.setHSL(this.targets()[0].hue, 0.9, 0.7);
              }
            });
          }
        });
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