FROM public.ecr.aws/lambda/python:3.11

# Install dependencies
COPY delete_encryption_keys/requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install -r requirements.txt

# Copy shared code
COPY encryption_common/ ${LAMBDA_TASK_ROOT}/encryption_common/

# Copy function code
COPY delete_encryption_keys/*.py ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD ["handler.lambda_handler"]
