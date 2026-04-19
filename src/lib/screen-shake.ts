export function screenShake(duration: number = 500, intensity: number = 10) {
  if (typeof window === "undefined") return;
  
  const startTime = Date.now();
  const element = document.documentElement;
  
  const shake = () => {
    const elapsed = Date.now() - startTime;
    
    if (elapsed < duration) {
      const progress = elapsed / duration;
      const easeOut = 1 - progress * progress;
      
      const x = (Math.random() - 0.5) * intensity * easeOut * 2;
      const y = (Math.random() - 0.5) * intensity * easeOut * 2;
      
      element.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(shake);
    } else {
      element.style.transform = "translate(0, 0)";
    }
  };
  
  shake();
}
