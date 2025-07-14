FROM public.ecr.aws/lambda/python:3.11

# Copy requirements file
COPY src/get_user_by_id/requirements.txt ${LAMBDA_TASK_ROOT}/
COPY src/common/requirements.txt ${LAMBDA_TASK_ROOT}/common-requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r common-requirements.txt

# Copy common code
COPY src/common/ ${LAMBDA_TASK_ROOT}/user_profile_common/

# Copy function code
COPY src/get_user_by_id/ ${LAMBDA_TASK_ROOT}/

# Set the CMD to the handler
CMD ["handler.lambda_handler"]