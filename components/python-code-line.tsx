const keywords = new Set(['import','from','as','def','return','if','elif','else','for','in','while','try','except','finally','raise','with','class','and','or','not','is','None','True','False','lambda','yield','pass','break','continue']);
export function PythonCodeLine({ code }: { code: string }) {
  const parts = code.match(/#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b|[^A-Za-z_\d#"']+/g) ?? [code];
  return <>{parts.map((part, index) => {
    const kind = part.startsWith('#') ? 'comment' : /^["']/.test(part) ? 'string' : /^\d/.test(part) ? 'number' : keywords.has(part) ? 'keyword' : /^\s*\(/.test(parts[index + 1] ?? '') ? 'function' : 'plain';
    return <em key={index} className={'python-token python-token-' + kind}>{part}</em>;
  })}</>;
}
