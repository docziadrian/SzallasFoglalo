export interface UserReview {
    id: number;
    accomodationId: number;
    username: string;
    rating: number;
    review_text: string;
    created_at: string;
  }
  
  export interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: {
      rating: number;
      count: number;
      percentage: number;
    }[];
  }