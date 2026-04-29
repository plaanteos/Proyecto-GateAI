FROM node:18-alpine

# Información de la imagen
LABEL name="uniontech-security"
LABEL version="1.0.0"
LABEL description="UnionTech Security Management System"

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S uniontech -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dumb-init para manejo de señales
RUN apk add --no-cache dumb-init

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY --chown=uniontech:nodejs . .

# Generar cliente Prisma para PostgreSQL
RUN npx prisma generate

# Crear directorios necesarios
RUN mkdir -p logs data/documents data/faces
RUN chown -R uniontech:nodejs logs data

# Configurar variables de entorno
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Exponer puerto
EXPOSE 3000

# Cambiar a usuario no-root
USER uniontech

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const req=http.request({host:'localhost',port:3000,path:'/health',timeout:2000},res=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>{process.exit(1)});req.end();"

# Comando de inicio con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server-complete.js"]
