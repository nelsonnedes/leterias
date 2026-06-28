"""API Routes"""
from .results import router as results_router
from .predictions import router as predictions_router
from .collections import router as collections_router

# Lista de routers a serem registrados
routes = [results_router, predictions_router, collections_router]