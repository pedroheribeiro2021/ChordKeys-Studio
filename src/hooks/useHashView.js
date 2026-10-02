import { useEffect, useRef, useState } from "react";

// Navegação entre telas pelo hash (#/violao): o "voltar" do celular funciona e
// não precisa de configuração de rotas no servidor.
// onChange(anterior, nova) roda no evento de navegação, antes de trocar a tela.
export function useHashView(views, fallback, onChange) {
  const read = () => {
    const view = window.location.hash.replace(/^#\/?/, "");
    return views.includes(view) ? view : fallback;
  };

  const [view, setView] = useState(read);
  const viewRef = useRef(view);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const handleHashChange = () => {
      const next = read();
      if (next === viewRef.current) return;

      onChangeRef.current?.(viewRef.current, next);
      viewRef.current = next;
      setView(next);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = (next) => {
    window.location.hash = `/${next}`;
  };

  return [view, navigate];
}
