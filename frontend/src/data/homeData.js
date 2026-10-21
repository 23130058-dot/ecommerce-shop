import categoryAccessoriesIcon from '../assets/lensrent/category-accessories.svg'
import categoryCameraIcon from '../assets/lensrent/category-camera.svg'
import categoryLensIcon from '../assets/lensrent/category-lens.svg'
import categoryStudioIcon from '../assets/lensrent/category-studio.svg'
import productA7 from '../assets/lensrent/product-a7.png'
import productMavic from '../assets/lensrent/product-mavic.png'
import productRf from '../assets/lensrent/product-rf.png'
import productVraptor from '../assets/lensrent/product-vraptor.png'

export const categories = [
  { name: 'Máy ảnh', count: '500+ sản phẩm', keyword: 'camera', slug: 'may-anh', icon: categoryCameraIcon },
  { name: 'Ống kính', count: '1,200+ sản phẩm', keyword: 'lens', slug: 'ong-kinh', icon: categoryLensIcon },
  { name: 'Phụ kiện', count: '800+ sản phẩm', keyword: 'accessory', slug: 'phu-kien', icon: categoryAccessoriesIcon },
  { name: 'Thiết bị Studio', count: '350+ sản phẩm', keyword: 'drone', slug: 'studio', icon: categoryStudioIcon },
]

export const products = [
  {
    name: 'Sony Alpha A7R V',
    type: 'MIRRORLESS CAMERA',
    category: 'camera',
    rating: '4.9',
    tags: ['61MP Full-frame', '8K Video'],
    price: 1200000,
    image: productA7,
    status: 'Sẵn sàng',
  },
  {
    name: 'RED V-RAPTOR XL',
    type: 'CINEMA CAMERA',
    category: 'camera cinema',
    rating: '5',
    tags: ['8K VV Sensor', '120fps'],
    price: 8500000,
    image: productVraptor,
    status: 'Sẵn sàng',
  },
  {
    name: 'Canon RF 15-35mm',
    type: 'WIDE-ANGLE LENS',
    category: 'lens',
    rating: '4.8',
    tags: ['f/2.8 Aperture', 'USM Motor'],
    price: 450000,
    image: productRf,
    status: 'Sẵn sàng',
  },
  {
    name: 'DJI Mavic 3 Pro',
    type: 'PHOTOGRAPHY DRONE',
    category: 'drone accessory',
    rating: '4.7',
    tags: ['Hasselblad Camera', '43min Flight'],
    price: 850000,
    image: productMavic,
    status: 'Đã thuê',
  },
]

export const sortOptions = [
  { key: 'popular', label: 'Phổ biến nhất' },
  { key: 'newest', label: 'Mới nhất' },
  { key: 'price', label: 'Giá tốt' },
]
