import { Request, Response } from "express";
import { Car } from "../../models/interfaces/car";

export const getCarList = async (req: Request, res: Response) => {
  try {
    const cars: Car[] = []; // await service function

    res.status(200).json({
      message: "List of all indexes retrieved successfully",
      data: cars,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get car list.",
      details: error instanceof Error ? error.message : error,
    });
  }
};

export const getCarById = async (req: Request, res: Response) => {
  // this is the car id sent to endpoint (API)
  // example: serverh-host:8080/cars/513513 -->> id = 513513
  const id = req.params.id;
  try {
    if (!id) {
      throw new Error("Car ID was not provided in request.");
    }

    const car: Car | null = null; // await service function

    res.status(200).json({
      message: "List of all indexes retrieved successfully",
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      error: `Failed to get car with ID ${id}.`,
      details: error instanceof Error ? error.message : error,
    });
  }
};

export const createCar = async (req: Request, res: Response) => {
  const carDto = req.body; // this will take the JSON object fromt the request

  // if you want to take only some fields from the body object
  // ex: const { carName } = req.body

  try {
    const response = true; // await createFunction

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      error: "Failed to create a new car",
      details: error instanceof Error ? error.message : error,
    });
  }
};
