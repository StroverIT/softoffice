console.log("READY");
const stripe = Stripe(
  "pk_test_51KCFECKIPDgFD4nJNHSWkyTZSdA8McsD56picQnhmqhlkRKwhhqNueiDKa8VVzl01WLrEGaXk6OAn3odlRSTJuyu0058loiBW0"
);
const button = document.querySelector(".cardpay");
button.addEventListener("click", (e) => {
  console.log("checkout");
  fetch(`/create-payment-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
    .then((res) => {
      console.log("Yes");
      if (res.ok) return res.json();
      console.log("FALSE");
      return res.json().then((json) => Promise.reject(json));
    })
    .then(({ url }) => {
      //   console.log(url);
      window.location = url;
    })
    .catch((e) => {
      console.error(e.error);
    });
});
