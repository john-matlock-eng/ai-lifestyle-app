FROM public.ecr.aws/lambda/python:3.11

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared goals module
COPY ../goals_common ${LAMBDA_TASK_ROOT}/goals_common

# Copy function code
COPY handler.py service.py ${LAMBDA_TASK_ROOT}/

# Set the handler
CMD ["handler.lambda_handler"]