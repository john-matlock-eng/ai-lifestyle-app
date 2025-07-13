FROM public.ecr.aws/lambda/python:3.11

# Copy requirements file
COPY src/create_ai_share/requirements.txt ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy common module
COPY src/common/ ${LAMBDA_TASK_ROOT}/common/

# Copy function code
COPY src/create_ai_share/ ${LAMBDA_TASK_ROOT}/

# Set the handler
CMD ["handler.lambda_handler"]
