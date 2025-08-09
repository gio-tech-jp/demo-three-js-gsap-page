import ThreeScene from './components/ThreeScene'

function App(): React.ReactElement {
  return (
    <div className="relative">
      {/* Fixed Three.js Background */}
      <div className="fixed top-0 left-0 w-screen h-screen z-0">
        <ThreeScene />
      </div>

      {/* Fixed Header */}
      <div className="fixed top-12 left-12 z-[100] pointer-events-none">
        <h1 className="text-4xl m-0 mb-2.5 text-white drop-shadow-md">
          音楽業界のDX革新
        </h1>
        <p className="text-xl m-0 opacity-80 text-white drop-shadow-sm">
          スクロールで音楽の未来を体験
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="relative z-10 min-h-[300vh] bg-transparent">
        {/* Section 1 */}
        <div className="h-screen flex items-center justify-end pr-20">
          <div className="max-w-md bg-black/20 backdrop-blur-sm p-8 rounded-lg">
            <h2 className="text-2xl text-white mb-4">音楽体験の革新プラットフォーム</h2>
            <p className="text-gray-200">
              AIとデジタル技術を活用し、アーティストとファンを繋ぐ新しい音楽体験を創造。
              リアルタイムなインタラクションとパーソナライゼーションで、
              音楽業界に革新的なソリューションを提供します。
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <div className="h-screen flex items-center justify-start pl-20">
          <div className="max-w-md bg-black/20 backdrop-blur-sm p-8 rounded-lg">
            <h2 className="text-2xl text-white mb-4">データドリブンな音楽配信</h2>
            <p className="text-gray-200">
              楽曲分析、ユーザー行動データ、トレンド予測を統合したDXプラットフォームで、
              レーベルとアーティストの成功をサポート。最適な楽曲配信戦略と
              ファンエンゲージメント向上を実現します。
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="h-screen flex items-center justify-center">
          <div className="max-w-md bg-black/20 backdrop-blur-sm p-8 rounded-lg text-center">
            <h2 className="text-2xl text-white mb-4">次世代音楽コミュニティ</h2>
            <p className="text-gray-200">
              ブロックチェーン技術とメタバース空間を活用した、
              新しい音楽コミュニティプラットフォーム。アーティストの創作活動から
              ファンとの交流まで、音楽業界全体のDX化を推進します。
            </p>
            <div className="mt-6">
              <p className="text-sm text-gray-300">
                インタラクティブな音楽体験をお試しください
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
