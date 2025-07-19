FROM public.ecr.aws/lambda/python:3.11

# Copy common modules first
COPY user_profile_common /var/runtime/user_profile_common

# Copy function code
COPY update_user_profile/*.py ${LAMBDA_TASK_ROOT}/

# Install dependencies
COPY update_user_profile/requirements.txt .
RUN pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# Set the CMD to the handler
CMD ["handler.lambda_handler"]