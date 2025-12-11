import { Injectable } from '@angular/core';
import axios from 'axios';
import { ApiResponse } from '../interfaces/apiresponse';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  SERVER = environment.serverUrl;

  constructor() {}

  async registration(table: string, data: any) {
    try {
      const response = await axios.post(
        `${this.SERVER}/${table}/registration`,
        data
      );
      return {
        status: 200,
        message: 'A regisztráció sikeres! Most már beléphetsz!',
        data: response.data, // nem kötelező visszaköldeni
      };
    } catch (err: any) {
      return {
        status: 500,
        message: err.response.data.error,
      };
    }
  }

  async login(table: string, data: any) {
    try {
      const response = await axios.post(`${this.SERVER}/${table}/login`, data);
      return {
        status: 200,
        message: 'Sikeres belépés!',
        data: response.data, // nem kötelező visszaköldeni
      };
    } catch (err: any) {
      return {
        status: 500,
        message: err.response.data.error,
      };
    }
  }

  async upload(formData: FormData): Promise<ApiResponse> {
    try {
      const response = await axios.post(`${this.SERVER}/upload`, formData);
      return {
        status: 200,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Nem sikerült a fájl feltöltése!',
      };
    }
  }

  async deleteImage(filename: string): Promise<ApiResponse> {
    try {
      const response = await axios.delete(`${this.SERVER}/image/${filename}`);
      return {
        status: 200,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Nem sikerült a fájl törlése!',
      };
    }
  }

  async sendmail(data: object): Promise<ApiResponse> {
    try {
      const response = await axios.post(`${this.SERVER}/sendmail`, data);
      return {
        status: 200,
        message: response.data.message,
      };
    } catch (err: any) {
      return {
        status: 500,
        message: err.response.data.error,
      };
    }
  }

  // GET ALL record from 'table'  -> GET http://localhost:3000/users

  async selectAll(table: string): Promise<ApiResponse> {
    try {
      const response = await axios.get(`${this.SERVER}/${table}`);
      return {
        status: 200,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Hiba történt az adatok elérésekor!',
      };
    }
  }

  // GET ONE record from 'table' by 'id'  -> GET http://localhost:3000/users/5

  async select(table: string, id: number): Promise<ApiResponse> {
    try {
      const response = await axios.get(`${this.SERVER}/${table}/${id}`);
      return {
        status: 200,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Hiba történt az adatok elérésekor!',
      };
    }
  }

  async selectAccomodationImages(accomodationId: number): Promise<ApiResponse> {
    try {
      const response = await axios.get(
        `${this.SERVER}/accomodations/${accomodationId}/images`
      );
      return {
        status: 200,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Nem sikerült a képek betöltése!',
      };
    }
  }

  async selectAccomodationFeatures(accomodationId: number): Promise<ApiResponse> {
    try {
      const response = await axios.get(
        `${this.SERVER}/accomodations/${accomodationId}/features`
      );
      return {
        status: 200,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Nem sikerült a tulajdonságok betöltése!',
      };
    }
  }

  async selectAccomodationAvailability(
    accommodationId: number,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse> {
    try {
      let url = `${this.SERVER}/accomodations/${accommodationId}/availability`;
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url);
      return {
        status: 200,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Nem sikerült az elérhetőség betöltése!',
      };
    }
  }

  async selectAccomodationBookings(
    accommodationId: number
  ): Promise<ApiResponse> {
    try {
      const response = await axios.get(
        `${this.SERVER}/bookings/accommodation/${accommodationId}`
      );
      return {
        status: 200,
        data: response.data,
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Nem sikerült a foglalások betöltése!',
      };
    }
  }

  async createBooking(bookingData: any): Promise<ApiResponse> {
    try {
      const response = await axios.post(`${this.SERVER}/bookings`, bookingData);
      return {
        status: 201,
        data: response.data,
        message: 'Foglalás sikeresen létrehozva!',
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Nem sikerült a foglalás létrehozása!',
      };
    }
  }

  // POST new record to 'table'  -> POST http://localhost:3000/users

  async insert(table: string, data: any) {
    try {
      const response = await axios.post(`${this.SERVER}/${table}`, data);
      return {
        status: 200,
        message: 'A rekord felvéve!',
        data: response.data, // nem kötelező visszaköldeni
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Hiba történt a művelet során!',
      };
    }
  }

  // UPDATE record from 'table' by 'id'  -> PATCH http://localhost:3000/users/5

  async update(table: string, id: number, data: any) {
    try {
      const response = await axios.patch(`${this.SERVER}/${table}/${id}`, data);
      return {
        status: 200,
        message: 'A rekord módosítva!',
        data: response.data, // nem kötelező visszaköldeni
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Hiba történt a művelet során!',
      };
    }
  }

  // DELETE ONE record from 'table' by 'id'  -> DELETE http://localhost:3000/users/5

  async delete(table: string, id: number) {
    try {
      const response = await axios.delete(`${this.SERVER}/${table}/${id}`);
      return {
        status: 200,
        message: 'A rekord törölve a táblából!',
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Hiba történt a művelet során!',
      };
    }
  }

  // DELETE ALL!!! record from 'table'  -> DELETE http://localhost:3000/users

  async deleteAll(table: string) {
    try {
      const response = await axios.delete(`${this.SERVER}/${table}`);
      return {
        status: 200,
        message: 'Összes rekord törölve a táblából!',
      };
    } catch (error: any) {
      return {
        status: 500,
        message: 'Hiba történt a művelet során!',
      };
    }
  }
}
