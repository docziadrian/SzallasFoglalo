import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  
  constructor(private apiService: ApiService) {}

  async validateCoupon(code: string, amount: number): Promise<any> {
    return await this.apiService.post('/coupons/validate', { code, amount });
  }

  async getCoupons(): Promise<any> {
    return await this.apiService.selectAll('coupons/list');
  }
}
