import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const ThreeScene = (): React.ReactElement => {
  // React Refを使ってDOM要素とThree.jsオブジェクトを参照
  const mountRef = useRef<HTMLDivElement>(null); // Three.jsキャンバスをマウントするDOM要素への参照
  const sceneRef = useRef<THREE.Scene | null>(null); // Three.jsシーンオブジェクトへの参照
  const cubeRef = useRef<THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial> | null>(null); // キューブメッシュへの参照
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

    // === 3Dオブジェクト（キューブ）の作成 ===
    
    // ジオメトリ（Geometry）: オブジェクトの形状を定義
    const geometry = new THREE.BoxGeometry(1, 3, 1); // 2x2x2のボックス形状
    
    // 発色の良いランダムカラーを生成
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
    
    // マテリアル（Material）: オブジェクトの見た目（色、質感）を定義
    const material = new THREE.MeshPhongMaterial({ 
      color: randomColor, // ランダムなビビッドカラー
      shininess: 100, // 光沢の強さを上げて発色を良く
      specular: 0xffffff, // ハイライト色を白にして輝きを強調
      emissive: randomColor, // 自発光を追加してさらに鮮やか
      emissiveIntensity: 0.1 // 自発光の強度
    });
    
    // メッシュ（Mesh）: ジオメトリとマテリアルを組み合わせた3Dオブジェクト
    const cube = new THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial>(geometry, material);
    
    // 初期回転をランダムに設定
    cube.rotation.x = Math.random() * Math.PI * 2; // 0-360度ランダム回転
    cube.rotation.y = Math.random() * Math.PI * 2; // 0-360度ランダム回転
    cube.rotation.z = Math.random() * Math.PI * 2; // 0-360度ランダム回転
    
    // 初期位置をランダムに設定（画面内の適度な範囲で）
    cube.position.x = (Math.random() - 0.5) * 4; // -2 から +2 の範囲
    cube.position.y = (Math.random() - 0.5) * 4; // -2 から +2 の範囲
    cube.position.z = (Math.random() - 0.5) * 2; // -1 から +1 の範囲
    
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
        
        // === 初期回転値を保存（初回のみ） ===
        if (!cubeRef.current.userData.initialRotationX) {
          cubeRef.current.userData.initialRotationX = cubeRef.current.rotation.x;
          cubeRef.current.userData.initialRotationY = cubeRef.current.rotation.y;
          cubeRef.current.userData.initialRotationZ = cubeRef.current.rotation.z;
          
          // 初期カメラ位置も保存
          cubeRef.current.userData.initialCameraZ = cameraRef.current.position.z;
        }
        
        const initialRotationX = cubeRef.current.userData.initialRotationX;
        const initialRotationY = cubeRef.current.userData.initialRotationY;
        const initialRotationZ = cubeRef.current.userData.initialRotationZ;
        
        // === ターゲット値を計算（より緩やかな変化） ===
        targetValues.current.rotationX = initialRotationX + scrollProgress * Math.PI * 2; // 2回転→1回転に削減
        targetValues.current.rotationY = initialRotationY + scrollProgress * Math.PI * 1.5; // 1.5回転→0.75回転に削減
        targetValues.current.rotationZ = initialRotationZ + scrollProgress * Math.PI * 1; // 1回転→0.5回転に削減
        
        // カメラズーム（より緩やか）
        const minZ = 4; // 最小距離を少し遠くに
        const maxZ = 8; // 最大距離を近めに
        targetValues.current.cameraZ = minZ + scrollProgress * (maxZ - minZ);
        
        // 位置変化（より小さく）
        targetValues.current.positionX = Math.sin(scrollProgress * Math.PI * 1.5) * 0.5; // 振幅を半分に
        targetValues.current.positionY = Math.cos(scrollProgress * Math.PI * 2) * 0.3; // 振幅を小さく
        
        // 色相変化
        targetValues.current.hue = scrollProgress * 0.8; // 色相変化を少し抑制
        
        // スケール変化（より微細に）
        targetValues.current.scale = 1 + Math.sin(scrollProgress * Math.PI * 1.5) * 0.15; // 振幅を小さく
        
        // === GSAPを使ったスムーズな補間アニメーション ===
        const duration = 0.8; // アニメーション時間を長くしてよりスムーズに
        const ease = "power2.out"; // イージング関数で自然な動き
        
        // 回転のアニメーション
        gsap.to(cubeRef.current.rotation, {
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
        gsap.to(cubeRef.current.position, {
          x: targetValues.current.positionX,
          y: targetValues.current.positionY,
          duration: duration,
          ease: ease
        });
        
        // スケールのアニメーション
        gsap.to(cubeRef.current.scale, {
          x: targetValues.current.scale,
          y: targetValues.current.scale,
          z: targetValues.current.scale,
          duration: duration,
          ease: ease
        });
        
        // 色のアニメーション（HSL色空間でスムーズに）
        gsap.to({ hue: cubeRef.current.material.color.getHSL({ h: 0, s: 0, l: 0 }).h }, {
          hue: targetValues.current.hue,
          duration: duration,
          ease: ease,
          onUpdate: function() {
            cubeRef.current?.material.color.setHSL(this.targets()[0].hue, 0.9, 0.7);
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