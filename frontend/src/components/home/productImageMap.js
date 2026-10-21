import productA7 from '../../assets/lensrent/product-a7.png'
import productMavic from '../../assets/lensrent/product-mavic.png'
import productRf from '../../assets/lensrent/product-rf.png'
import productVraptor from '../../assets/lensrent/product-vraptor.png'

const productImages = {
  'product-a7.png': productA7,
  'product-mavic.png': productMavic,
  'product-rf.png': productRf,
  'product-vraptor.png': productVraptor,
}

export function resolveProductImage(imageKey) {
  const fileName = imageKey?.split('/').pop()
  return productImages[fileName]
      || (imageKey?.startsWith('https://') || imageKey?.startsWith('http://') || imageKey?.startsWith('/') || imageKey?.startsWith('data:image/') ? imageKey : productA7)
}