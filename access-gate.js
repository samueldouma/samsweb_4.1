(() => {
  "use strict";
  const KEY="sam-access-2003-v1", EXPECTED="2003!";
  function sameSiteReferrer(){
    try { return Boolean(document.referrer) && new URL(document.referrer).origin === location.origin; }
    catch(_) { return false; }
  }
  function goBack(){
    if(sameSiteReferrer()) history.back();
    else location.href="index.html";
  }
  function unlock(){
    sessionStorage.setItem(KEY,"granted");
    document.documentElement.classList.remove("access-pending");
    document.querySelector(".access-gate")?.remove();
  }
  if(sessionStorage.getItem(KEY)==="granted"){
    document.documentElement.classList.remove("access-pending");
    return;
  }
  document.addEventListener("DOMContentLoaded",()=>{
    const embedded = new URLSearchParams(location.search).get("embedded") === "1";
    const gate=document.createElement("div");
    gate.className="access-gate";
    gate.innerHTML=`${embedded ? "" : '<button class="access-gate-back" type="button" aria-label="Return to previous page"><span aria-hidden="true"></span></button>'}<div class="access-gate-inner"><p class="access-gate-message">TEMPORARILY BLOCKED -- CONTACT SAM FOR ACCESS CODE</p><form class="access-gate-form" autocomplete="off"><input class="access-gate-input" type="password" aria-label="Access code" maxlength="20" autocapitalize="off" spellcheck="false"></form><p class="access-gate-error" aria-live="polite"></p></div>`;
    document.body.appendChild(gate);
    gate.querySelector(".access-gate-back")?.addEventListener("click",goBack);
    const form=gate.querySelector("form"), input=gate.querySelector("input"), error=gate.querySelector(".access-gate-error");
    form.addEventListener("submit",e=>{
      e.preventDefault();
      if(input.value===EXPECTED) unlock();
      else { input.value=""; error.textContent="INCORRECT CODE"; input.focus(); }
    });
    input.focus();
  });
})();
