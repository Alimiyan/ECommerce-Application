var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectID

module.exports ={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTIONS).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
        })  
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus= false
            let respone={}
            var user= await db.get().collection(collection.USER_COLLECTIONS).findOne({Email: userData.Email})
            if(user){
                bcrypt.compare(userData.Password, user.Password).then((status)=>{
                    if(status){
                        console.log("Login success");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("Login failed");
                        resolve({status:false})
                    }
                })
            }else{
                console.log("Login failed")
                resolve({status:false})
            }
        })
    },

    addToCart:(proId,userId)=>{
        let proObj= {
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
          let userCart= await db.get().collection(collection.CART_COLLECTIONS).findOne({user: objectId(userId)})  
          if(userCart){
              let proExist = userCart.products.findIndex(products=> products.item==proId)
              if(proExist!= -1){
                  db.get().collection(collection.CART_COLLECTIONS)
                  .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                  {
                      $inc:{'products.$.quantity':1}
                  }
                  ).then(()=>{
                      resolve()
                  })
              }else{
                db.get().collection(collection.CART_COLLECTIONS)
                .updateOne({user:objectId(userId)},
                    {
                        $push:{products:proObj}
                    }
                ).then((response)=>{
                    resolve()   
                }) 
                }
          }else{
              let cartObj={
                  user: objectId(userId),
                  products: [proObj]
              }
              db.get().collection(collection.CART_COLLECTIONS).insertOne(cartObj).then((response)=>{
                  resolve()
              })
          }
        })
    },

    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems= await db.get().collection(collection.CART_COLLECTIONS).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTIONS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        products:{$arrayElemAt:['$products',0]}
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },

    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count= 0
            let cart= await db.get().collection(collection.CART_COLLECTIONS).findOne({user: objectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity:(details)=>{
        count = parseInt(details.count)
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTIONS)
            .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
            {
                $inc:{'products.$.quantity':count}
            }
            ).then((respone)=>{
                console.log(response)
                resolve()
            })
        })
    }
    
}   