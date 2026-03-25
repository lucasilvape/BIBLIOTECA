document$.subscribe(function () {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default"
  });

  mermaid.run({
    querySelector: ".mermaid"
  });
});
