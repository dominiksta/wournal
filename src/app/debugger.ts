window.addEventListener('keydown', e => {
  if (!e.altKey || !e.shiftKey || !e.ctrlKey || e.key !== 'D') return;
  console.warn('DEBUGGER STARTED MANUALLY');
  debugger;
});
