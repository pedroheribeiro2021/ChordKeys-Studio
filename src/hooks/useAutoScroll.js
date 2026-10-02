import { useEffect, useRef } from "react";

// Rola a página na velocidade pedida (px/s) enquanto `active`, como no Cifra Club.
// Mantém a tela acesa (Wake Lock) durante a rolagem e chama onEnd no fim da página.
export function useAutoScroll(active, pxPerSecond, onEnd) {
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (!active) return;

    let frame;
    let last = performance.now();
    let carry = 0;
    let lock = null;
    let cancelled = false;

    navigator.wakeLock
      ?.request("screen")
      .then((l) => (cancelled ? l.release() : (lock = l)))
      .catch(() => {});

    const step = (now) => {
      // Limita o salto se a aba ficou em segundo plano
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      // scrollBy só anda pixel inteiro: acumula a fração entre quadros
      carry += pxPerSecond * dt;
      const whole = Math.floor(carry);
      if (whole > 0) {
        window.scrollBy(0, whole);
        carry -= whole;
      }

      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atEnd) {
        onEndRef.current?.();
        return;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lock?.release().catch(() => {});
    };
  }, [active, pxPerSecond]);
}
