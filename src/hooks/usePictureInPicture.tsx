import { useState } from 'react';
import { createPortal } from 'react-dom';

export function usePictureInPicture({ width = 500, height = 500 }) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const isSupported =
    typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  // TODO: 環境変数に設定して管理する
  const browserCompatibility = 'Chrome 116~, Edge 116~, Opera 102~';
  const pointInTime = '2025年2月';

  const alertMessage = `このブラウザは Document Picture in Picture API をサポートしていません。${browserCompatibility}をお試しください。（${pointInTime}時点）`;

  async function handleOpenPipWindow() {
    if (!isSupported) {
      alert(alertMessage);
      return;
    }

    const newPipWindow = await window.documentPictureInPicture?.requestWindow({
      disallowReturnToOpener: false,
      height: height,
      preferInitialWindowPlacement: true,
      width: width,
    });

    if (!newPipWindow) return;
    setPipWindow(newPipWindow);

    newPipWindow.addEventListener('pagehide', () => {
      setPipWindow(null);
    });

    Array.from(document.styleSheets).forEach((styleSheet) => {
      try {
        const cssRules = Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join('');
        const styleElm = document.createElement('style');

        styleElm.textContent = cssRules;
        newPipWindow.document.head.appendChild(styleElm);
      } catch {
        const linkElm = document.createElement('link');

        if (styleSheet.href == null) return;

        linkElm.rel = 'stylesheet';
        linkElm.type = styleSheet.type;
        linkElm.media = styleSheet.media.toString();
        linkElm.href = styleSheet.href;
        newPipWindow.document.head.appendChild(linkElm);
      }
    });
  }

  function handleClosePipWindow() {
    pipWindow?.close();
    setPipWindow(null);
  }

  return { handleOpenPipWindow, handleClosePipWindow, pipWindow };
}

type PictureInPictureWindowProps = {
  pipWindow: Window | null;
  children: React.ReactNode;
};

// Picture in Picture Windowの状態変数と子要素を受け取って、ウィンドウが開かれている場合は子要素をポータルで描画するが、開かれていない場合はそのまま子要素を描画する
export default function PictureInPictureWindow({
  pipWindow,
  children,
}: PictureInPictureWindowProps) {
  return pipWindow ? (
    createPortal(children, pipWindow.document.body)
  ) : (
    <>{children}</>
  );
}
