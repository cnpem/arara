FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
COPY app.py app.py
COPY .env .env
COPY 0bashset 0bashset
COPY packages/ /app/packages/
RUN apt update && \
    apt install -y --no-install-recommends \
        cmake \
        g++ \
        git \
        openssh-client && \ 
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
RUN pip install git+https://github.com/paulscherrerinstitute/cbf.git
ENV PYTHONUNBUFFERED 1
CMD [ "bash", "-c", "source 0bashset && python3 -u app.py" ]
