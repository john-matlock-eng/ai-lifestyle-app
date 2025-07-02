FROM public.ecr.aws/lambda/python:3.11

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Lambda function code
COPY . ${LAMBDA_TASK_ROOT}

# Set the handler
CMD ["handler.lambda_handler"]
