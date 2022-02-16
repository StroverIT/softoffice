module.exports = function Cart(oldCart) {
  this.items = oldCart.items || {};
  this.totalQty = oldCart.totalQty || 0;
  this.totalPrice = oldCart.totalPrice || 0;
  this.ddsPrice = oldCart.ddsPrice || 0

  this.dostavkaPrice = oldCart.dostavkaPrice || 5

  if(this.ddsPrice >=50){
    this.dostavkaPrice = 0
  }
  this.totalCheckout = this.ddsPrice + this.dostavkaPrice
  this.add = function (item, id,  addQty) {
    let storedItem = this.items[id];
    if (!storedItem) {
      console.log("Not found");
      storedItem = this.items[id] = { item: item, totalQty: 0, cena: 0, addedQty: 0 };
    }
  const isOnPromotion = storedItem.item.typeSection.isOnPromotion;
    storedItem.totalQty += +addQty
    this.totalQty += +addQty
    let addPrice
    if(isOnPromotion){
      addPrice = +storedItem.item.typeSection.promotionalPrice
    }else{
      addPrice = +storedItem.item.typeSection.cena
    }
    this.totalPrice += addPrice * +addQty
    this.ddsPrice = this.totalPrice + (this.totalPrice * 0.20)
  };
  this.reduceItem = function(id, quanity){
    // console.log(this.items[id])
    this.items[id].totalQty -= +quanity;
    this.items[id].cena -= +this.items[id].item.typeSection.cena * +quanity

    this.totalQty -= +quanity;
    this.totalPrice -=+this.items[id].item.typeSection.cena * +quanity
    this.ddsPrice =this.totalPrice + this.totalPrice* 0.20
    console.log(oldCart.totalQty)
    if(this.items[id].totalQty <= 0 ){
      delete this.items[id]
    }
    if(oldCart.totalQty <= 0){
       delete oldCart
    }
  }
  this.removeItem = function(id){
    // console.log(this.items[id])
    this.totalQty -= this.items[id].totalQty
    this.totalPrice -= this.items[id].cena
    delete this.items[id]
  }
  this.generateArray = function () {
    var arr = [];
    for (var id in this.items) {
      arr.push(this.items[id]);
    }
    return arr;
  };
};
