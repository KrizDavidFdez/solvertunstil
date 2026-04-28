FROM node:20

# Instalar ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos
COPY package*.json ./
RUN npm install

COPY . .

# Exponer puerto (si usas uno)
EXPOSE 3000

# Ejecutar app
CMD ["node", "index.js"]