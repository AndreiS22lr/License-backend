import { Product } from "../../models/interfaces/product";

export const getProductListService = async () => {
  try {
    const products: Product[] = [
      {
        id: "test1",
        price: 10,
        name: "NoName",
        inStock: false,
      },
      {
        id: "test2",
        price: 20,
        name: "Name",
        inStock: true,
      },
    ];

    return products;
  } catch (error: any) {
    throw new Error(`Elasticsearch error: ${error.message}`);
  }
};

// export const getProductById = async (id: string) => {
//   try {
//     return {
//       product: "product", // return the product from persistance layer that access database
//     };
//   } catch (error) {
//     throw new Error(
//       `Couldn't find the product with ID ${id}, ${error.message}`
//     );
//   }
// };
