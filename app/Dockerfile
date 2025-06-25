FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
COPY app.py app.py
COPY .env .env
COPY 0bashset 0bashset
COPY packages/ /app/packages/
ENV PYTHONUNBUFFERED 1
CMD [ "bash", "-c", "source 0bashset && python3 -u app.py" ]
