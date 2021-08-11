var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
 // res.send('respond with a resource');
 productHelpers.getAllProducts().then((products)=>{
   console.log(products)
  res.render('admin/view-products',{admin: true, products})
 })
});

router.get('/add-products', function(req,res){
  res.render('admin/add-products')

})

router.post('/add-products', (req, res)=>{
  console.log(req.body)
  console.log(req.files.Image)

  productHelpers.addProduct(req.body,(req.body,(id)=>{
    let image = req.files.Image
    // moving image to a path and naming it
    // 
    image.mv('./public/product-images/' + id + '.jpg', (err)=>{
      if(!err){
        res.render("admin/add-products")
      }else{
        console.log(err)
      }

    })
    
  }))
})

//delete-product
router.get('/delete-product/:id',(req,res)=>{
  let proId= req.params.id
  //console.log(proId)
  productHelpers.deleteProducts(proId).then((response)=>{
    res.redirect('/admin/')
  })
  
})

module.exports = router;
