document.addEventListener("DOMContentLoaded", () => {
  const allowedTopics = new Set(["buying", "selling", "value", "question"]);
  const params = new URLSearchParams(window.location.search);
  const topic = params.get("topic");
  const topicSelect = document.querySelector("#contact-topic");
  if (topicSelect && topic && allowedTopics.has(topic)) {
    topicSelect.value = topic;
  }

  document.querySelectorAll("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const statusId = form.getAttribute("action")?.replace("#", "") || "";
      const status = statusId ? document.getElementById(statusId) : null;
      const honeypot = form.querySelector('input[name="company"]');

      if (!form.reportValidity()) return;

      if (status) {
        status.hidden = false;
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.focus();
      }

      if (honeypot && honeypot.value.trim()) {
        return;
      }
    });
  });
});
