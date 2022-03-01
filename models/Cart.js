
module.exports = function Cart(oldCart) {
  this.items = oldCart.items || {};
  this.totalQty = oldCart.totalQty || 0;
  this.totalPrice = oldCart.totalPrice || 0;
  this.ddsPrice = oldCart.totalPrice * 0.2 || 0
  this.dostavkaPrice = oldCart.dostavkaPrice || 5
  this.promotionPrice = oldCart.promotionPrice || 0
  this.promotionsItems = oldCart.promotionsItems || []
  if(this.totalCheckout >=50){
    this.dostavkaPrice = 0
  }
  // Without deliveryPrice
  console.log("PROMOTION", this.promotionPrice);
  this.priceCart = this.ddsPrice + this.totalPrice - this.promotionPrice
  this.totalCheckout = (this.ddsPrice + this.totalPrice + this.dostavkaPrice) - this.promotionPrice

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
    if(this.promotionsItems.includes(storedItem.item.typeSection._id.toString())){
      // console.log(storedItem);
      const price = Number(storedItem.item.typeSection.cena) * 0.20
      this.promotionPrice+= price * addQty
    }
    storedItem.cena += addPrice * addQty

    this.totalPrice += addPrice * +addQty
    // this.ddsPrice = this.totalPrice + (this.totalPrice * 0.20)
  };
  this.reduceItem = function(id, quanity){
    // console.log(this.items[id])
    this.items[id].totalQty -= +quanity;

    let storedItem = this.items[id];
  const isOnPromotion = storedItem.item.typeSection.isOnPromotion;
    
    let removePrice
    if(isOnPromotion){
      removePrice = +storedItem.item.typeSection.promotionalPrice
    }else{
      removePrice = +storedItem.item.typeSection.cena
    }
    if(this.promotionsItems.includes(id.toString())){
      // console.log(storedItem);
      const price = Number(storedItem.item.typeSection.cena) * 0.20
      this.promotionPrice-= price * quanity
    }
    this.items[id].cena -= removePrice * +quanity

    this.totalQty -= +quanity;
    this.totalPrice -=removePrice * +quanity
    // this.ddsPrice =this.totalPrice + this.totalPrice* 0.20
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
    const index = this.promotionsItems.indexOf(id)
    if(index != -1){
      this.promotionsItems.splice(index, 1)
    }
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

  this.addPromotionsList = function(id){
    const idString = id.toString()
    console.log(this.promotionsItems);
    console.log(id);
    console.log("INDEX",this.promotionsItems.indexOf(idString));
    if(this.promotionsItems.indexOf(idString) == -1){
      this.promotionsItems.push(idString)
    }
    
  }
};
