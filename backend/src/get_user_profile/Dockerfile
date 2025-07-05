FROM public.ecr.aws/lambda/python:3.11

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY . ${LAMBDA_TASK_ROOT}

# Set the handler
CMD ["handler.lambda_handler"]
