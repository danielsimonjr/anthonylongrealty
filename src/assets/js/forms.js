document.addEventListener("DOMContentLoaded", () => {
  const allowedTopics = new Set(["buying", "selling", "value", "question"]);
  const topic = new URLSearchParams(window.location.search).get("topic");
  const topicSelect = document.querySelector("#contact-topic");
  if (topicSelect && allowedTopics.has(topic)) {
    topicSelect.value = topic;
  }

  document.querySelectorAll("form[data-demo-form]").forEach((form) => {
    const statusId = (form.getAttribute("action") || "").replace("#", "");
    const status = statusId ? document.getElementById(statusId) : null;

    // A failed attempt must not leave an earlier "did not send" message on screen.
    form.addEventListener(
      "invalid",
      () => {
        if (status) status.hidden = true;
      },
      true
    );

    // The browser has already run its validation UI before this event fires.
    // Whether or not the hidden "company" field is filled, nothing is sent.
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!status) return;
      status.hidden = false;
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.focus();
    });
  });
});
