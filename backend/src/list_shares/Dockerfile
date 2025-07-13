FROM public.ecr.aws/lambda/python:3.11

# Copy requirements file
COPY src/list_shares/requirements.txt ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy common modules
COPY src/encryption_common ${LAMBDA_TASK_ROOT}/encryption_common/

# Copy function code
COPY src/list_shares/handler.py ${LAMBDA_TASK_ROOT}/

# Set the CMD to the handler
CMD ["handler.lambda_handler"]
