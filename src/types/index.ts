export interface User {
  id: string
  email: string
  name?: string
  role: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
  email_verified: boolean
  premium_expires_at?: string
}

export interface AuthToken {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface LoginRequest {
  email: string
}

export interface LoginVerify {
  email: string
  code: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface StockData {
  symbol: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adj_close?: number
}

export interface StockPick {
  instrument: string
  score: number
  strategy?: string
  final_score?: number
  weighted_score?: number
}

export interface DailyPicks {
  date: string
  direction: 'RISING' | 'FALLING'
  picks: StockPick[]
  total_count: number
  is_premium_required: boolean
}

export interface Prediction {
  symbol: string
  date: string
  prediction: number
  confidence: number
  direction: 'UP' | 'DOWN' | 'NEUTRAL'
}

export interface PredictionsResponse {
  date: string
  predictions: Prediction[]
  total_count: number
  is_premium_required: boolean
}

export interface BacktestResult {
  symbol: string
  start_date: string
  end_date: string
  initial_capital: number
  final_value: number
  total_return: number
  annualized_return: number
  max_drawdown: number
  sharpe_ratio: number
  win_rate: number
  total_trades: number
  profitable_trades: number
  losing_trades: number
  avg_win: number
  avg_loss: number
  trades: Trade[]
}

export interface Trade {
  date: string
  action: 'BUY' | 'SELL'
  price: number
  quantity: number
  value: number
  profit_loss?: number
}

export interface AvailableDates {
  pick_dates: string[]
  prediction_dates: string[]
}

export interface StockList {
  symbols: string[]
  total_count: number
}

export interface ApiError {
  detail: string
  status_code?: number
}

export interface ChartData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export type Direction = 'RISING' | 'FALLING'

export type UserRole = 'FREE' | 'PREMIUM' | 'ENTERPRISE'

export interface PricingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  popular?: boolean
  description: string
}
