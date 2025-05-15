import { Unity, useUnityContext } from "react-unity-webgl";

function UnityTest() {
  const { unityProvider, sendMessage } = useUnityContext({
    loaderUrl: "UnityBuild/ReactTest.loader.js",
    dataUrl: "UnityBuild/ReactTest.data.br",
    frameworkUrl: "UnityBuild/ReactTest.framework.js.br",
    codeUrl: "UnityBuild/ReactTest.wasm.br",
  });

  function moveRight() {
    sendMessage("Cube", "MoveRight", 1);
  }

  function moveLeft() {
    sendMessage("Cube", "MoveLeft", 1);
  }

  return (
    <div>
      <h1>ReactにUnity埋め込んでみた</h1>
      <button onClick={moveRight}>MoveRight</button>
      <button onClick={moveLeft}>MoveLeft</button>
      
      <Unity
        unityProvider={unityProvider}
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          width: "50%",
          height: "50%",
          zIndex: 1,
        }}
      />
    </div>
  );
}

export default UnityTest;