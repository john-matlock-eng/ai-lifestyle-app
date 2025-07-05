FROM public.ecr.aws/lambda/python:3.11

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY . ${LAMBDA_TASK_ROOT}

# Set the handler
CMD ["handler.lambda_handler"]
