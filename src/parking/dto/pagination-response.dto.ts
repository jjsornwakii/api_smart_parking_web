// src/parking/dto/pagination-response.dto.ts
export class PaginationResponseDto<T> {
    data: T[];
    meta: {
      total: number;
      page: number;
      lastPage: number;
    };
  }